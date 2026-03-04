from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, Throttled
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.core.exceptions import ValidationError
import logging

from .models import InterventionCase
from .serializers import InterventionCaseSerializer
from alerts.models import Alert
from core.idor_protection import IDORProtectionMixin
from notifications.email_service import send_case_escalation_notification, send_case_resolved_notification

logger = logging.getLogger(__name__)


class CaseUpdateThrottle(UserRateThrottle):
    rate = '10/hour'


# =====================================================
# LIST & CREATE INTERVENTION CASE
# =====================================================
class InterventionCaseListCreateView(generics.ListCreateAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Use default pagination from settings (50 items)

    def get_queryset(self):
        user = self.request.user
        qs = InterventionCase.objects.select_related('student', 'assigned_to', 'alert').all()

        # Admin sees everything
        if user.role == "admin":
            pass
        # Form master sees only assigned cases
        elif user.role == "form_master":
            qs = qs.filter(assigned_to=user)
        else:
            return InterventionCase.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in ["admin", "form_master"]:
            raise PermissionDenied("Not allowed to create intervention cases.")

        student = serializer.validated_data.get("student")

        if not student:
            raise PermissionDenied("Intervention case must be linked to a student.")

        # If form master creates, auto assign to themselves
        if user.role == "form_master":
            serializer.save(assigned_to=user)
        else:
            serializer.save()


# =====================================================
# DETAIL / UPDATE / DELETE
# =====================================================
class InterventionCaseDetailView(IDORProtectionMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [CaseUpdateThrottle]
    lookup_field = 'case_id'

    def get_queryset(self):
        """IDOR Protection: Filter by assignment"""
        user = self.request.user
        
        if user.role == 'admin':
            return InterventionCase.objects.all()
        
        if user.role == 'form_master':
            return InterventionCase.objects.filter(assigned_to=user)
        
        return InterventionCase.objects.none()

    def perform_update(self, serializer):
        user = self.request.user
        case = self.get_object()

        # Permission rules
        if user.role == "form_master" and case.assigned_to != user:
            raise PermissionDenied("You cannot update this case.")

        if user.role not in ["admin", "form_master"]:
            raise PermissionDenied("Permission denied.")
        
        # Input validation: meeting_notes max length
        meeting_notes = self.request.data.get('meeting_notes', '')
        if len(meeting_notes) > 2000:
            return Response({
                'error': 'Meeting notes cannot exceed 2000 characters.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Workflow validation: Cannot close case without resolution notes
        new_status = self.request.data.get('status')
        if new_status == 'closed' and not self.request.data.get('resolution_notes'):
            return Response({
                'error': 'Resolution notes are required to close a case.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Workflow validation: Cannot escalate closed case
        if case.status == 'closed' and new_status == 'escalated_to_admin':
            return Response({
                'error': 'Cannot escalate a closed case.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Version control check
        client_version = self.request.data.get('version')
        if client_version is not None:
            try:
                client_version = int(client_version)
                if case.version != client_version:
                    return Response({
                        'error': 'Case was modified by another user. Please refresh.',
                        'current_version': case.version
                    }, status=status.HTTP_409_CONFLICT)
            except (ValueError, TypeError):
                pass

        # Audit log before update
        logger.info(
            f"Case Update: case_id={case.case_id}, user={user.username}, "
            f"old_status={case.status}, new_status={new_status or case.status}, "
            f"progress_status={self.request.data.get('progress_status')}"
        )

        try:
            updated_case = serializer.save()
            
            # Send email if case escalated to admin
            if updated_case.status == 'escalated_to_admin' and case.status != 'escalated_to_admin':
                send_case_escalation_notification(updated_case)
            
            # Send email if case resolved
            if updated_case.status == 'closed' and case.status != 'closed':
                send_case_resolved_notification(updated_case)
            
            # Audit log after successful update
            logger.info(
                f"Case Updated Successfully: case_id={updated_case.case_id}, "
                f"user={user.username}, status={updated_case.status}"
            )
        except ValidationError as e:
            logger.error(f"Case Update Failed: case_id={case.case_id}, user={user.username}, error={str(e)}")
            return Response({
                'error': str(e),
                'current_version': case.version
            }, status=status.HTTP_409_CONFLICT)

        # =====================================================
        # 🔥 AUTO RESOLVE ALERT WHEN ALL CASES ARE CLOSED
        # =====================================================
        if (
            updated_case.status == "closed"
            and updated_case.alert_id
        ):
            alert = updated_case.alert

            # Check if ANY open cases still exist
            open_cases_exist = InterventionCase.objects.filter(
                alert=alert
            ).exclude(status="closed").exists()

            # Only resolve if no open cases remain
            if not open_cases_exist and alert.status != "resolved":
                alert.status = "resolved"
                alert.updated_at = timezone.now()
                alert.save()


# =====================================================
# INTERVENTIONS BY ALERT
# =====================================================
class InterventionsByAlertView(generics.ListAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        alert_id = self.kwargs["alert_id"]
        return InterventionCase.objects.filter(alert_id=alert_id)
