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

        # One active case per student — standard case management rule
        active_statuses = ['open', 'in_progress', 'awaiting_parent', 'escalated_to_admin']
        existing = InterventionCase.objects.filter(
            student=student,
            status__in=active_statuses
        ).first()
        if existing:
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError({
                'detail': (
                    f'An active intervention case (#{existing.case_id}) already exists '
                    f'for {student.full_name} with status \'{existing.get_status_display()}\'. '
                    f'Close the existing case before opening a new one.'
                )
            })

        # Snapshot attendance rate at case open
        from attendance.attendance_utils import compute_attendance_days
        try:
            totals = compute_attendance_days(student)
            rate_at_open = round(totals['attendance_rate'], 2)
        except Exception:
            rate_at_open = None

        # Auto-escalate if student is a chronic absentee (3+ prior closed cases)
        initial_status = serializer.validated_data.get('status', 'open')
        if student.chronic_absentee and initial_status not in ['escalated_to_admin']:
            initial_status = 'escalated_to_admin'
            logger.info(
                f'Auto-escalated case for chronic absentee student {student.student_id} '
                f'(intervention_count={student.intervention_count})'
            )

        # If form master creates, auto assign to themselves
        if user.role == "form_master":
            serializer.save(
                assigned_to=user,
                status=initial_status,
                attendance_rate_at_open=rate_at_open,
            )
        else:
            serializer.save(
                status=initial_status,
                attendance_rate_at_open=rate_at_open,
            )


# =====================================================
# DETAIL / UPDATE / DELETE
# =====================================================
class InterventionCaseDetailView(IDORProtectionMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]
    # throttle_classes = [CaseUpdateThrottle]  # Temporarily disabled for testing
    lookup_field = 'case_id'

    def get_queryset(self):
        """IDOR Protection: Filter by assignment"""
        user = self.request.user
        
        if user.role == 'admin':
            return InterventionCase.objects.all()
        
        if user.role == 'form_master':
            return InterventionCase.objects.filter(assigned_to=user)
        
        return InterventionCase.objects.none()
    
    def _validate_case_update(self, case, request_data):
        """Validate case update request"""
        # Input validation: meeting_notes max length
        meeting_notes = request_data.get('meeting_notes', '')
        if len(meeting_notes) > 2000:
            return Response({
                'error': 'Meeting notes cannot exceed 2000 characters.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Workflow validation: Cannot close case without resolution notes
        new_status = request_data.get('status')
        if new_status == 'closed' and not request_data.get('resolution_notes'):
            return Response({
                'error': 'Resolution notes are required to close a case.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Workflow validation: Cannot escalate closed case
        if case.status == 'closed' and new_status == 'escalated_to_admin':
            return Response({
                'error': 'Cannot escalate a closed case.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return None
    
    def _check_version_conflict(self, case, request_data):
        """Check for version conflicts"""
        client_version = request_data.get('version')
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
        return None
    
    def _handle_case_notifications(self, updated_case, old_status):
        """Handle email notifications for case updates"""
        # Send email if case escalated to admin
        if updated_case.status == 'escalated_to_admin' and old_status != 'escalated_to_admin':
            send_case_escalation_notification(updated_case)
        
        # Send email if case resolved
        if updated_case.status == 'closed' and old_status != 'closed':
            send_case_resolved_notification(updated_case)
    
    def _auto_resolve_alert(self, updated_case):
        """Auto resolve alert when all cases are closed"""
        if updated_case.status == "closed" and updated_case.alert_id:
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

    def perform_update(self, serializer):
        user = self.request.user
        case = self.get_object()
        old_status = case.status

        # Permission rules
        if user.role == "form_master" and case.assigned_to != user:
            raise PermissionDenied("You cannot update this case.")

        if user.role not in ["admin", "form_master"]:
            raise PermissionDenied("Permission denied.")
        
        # Validate update request
        validation_error = self._validate_case_update(case, self.request.data)
        if validation_error:
            return validation_error
        
        # Check version conflicts
        version_conflict = self._check_version_conflict(case, self.request.data)
        if version_conflict:
            return version_conflict

        # Audit log before update (sanitized)
        logger.info(
            f"Case Update: case_id={case.case_id}, user_id={user.id}, "
            f"old_status={case.status}, new_status={self.request.data.get('status') or case.status}, "
            f"progress_status={self.request.data.get('progress_status')}"
        )

        try:
            updated_case = serializer.save()
            
            # ── On case close: snapshot attendance rate + update student chronic tracking ──
            if updated_case.status == 'closed' and old_status != 'closed':
                from attendance.attendance_utils import compute_attendance_days
                try:
                    totals = compute_attendance_days(updated_case.student)
                    updated_case.attendance_rate_at_close = round(totals['attendance_rate'], 2)
                    # Use update() to avoid triggering version increment again
                    InterventionCase.objects.filter(pk=updated_case.pk).update(
                        attendance_rate_at_close=updated_case.attendance_rate_at_close
                    )
                except Exception:
                    pass

                # Increment intervention_count and set chronic_absentee if threshold reached
                student = updated_case.student
                new_count = student.intervention_count + 1
                is_chronic = new_count >= 3
                type(student).objects.filter(pk=student.pk).update(
                    intervention_count=new_count,
                    chronic_absentee=is_chronic,
                )
                if is_chronic and not student.chronic_absentee:
                    logger.info(
                        f'Student {student.student_id} ({student.full_name}) marked chronic absentee '
                        f'after {new_count} closed intervention cases.'
                    )

            # Handle notifications
            self._handle_case_notifications(updated_case, old_status)
            
            # Auto resolve alert
            self._auto_resolve_alert(updated_case)
            
            # Audit log after successful update (sanitized)
            logger.info(
                f"Case Updated Successfully: case_id={updated_case.case_id}, "
                f"user_id={user.id}, status={updated_case.status}"
            )
        except ValidationError as e:
            logger.error(f"Case Update Failed: case_id={case.case_id}, user_id={user.id}, error=ValidationError")
            return Response({
                'error': str(e),
                'current_version': case.version
            }, status=status.HTTP_409_CONFLICT)


# =====================================================
# INTERVENTIONS BY ALERT
# =====================================================
class InterventionsByAlertView(generics.ListAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        alert_id = self.kwargs["alert_id"]
        return InterventionCase.objects.filter(alert_id=alert_id)
