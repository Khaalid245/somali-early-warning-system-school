from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import InterventionCase
from .serializers import InterventionCaseSerializer
from alerts.models import Alert
from core.idor_protection import IDORProtectionMixin


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
            return qs

        # Form master sees only assigned cases
        if user.role == "form_master":
            return qs.filter(assigned_to=user)

        return InterventionCase.objects.none()

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
    queryset = InterventionCase.objects.all()
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        user = self.request.user
        case = self.get_object()

        # Permission rules
        if user.role == "form_master" and case.assigned_to != user:
            raise PermissionDenied("You cannot update this case.")

        if user.role not in ["admin", "form_master"]:
            raise PermissionDenied("Permission denied.")
        
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

        try:
            updated_case = serializer.save()
        except ValidationError as e:
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
