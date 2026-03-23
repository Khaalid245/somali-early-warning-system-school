from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from core.idor_protection import IDORProtectionMixin
from .models import Alert
from .serializers import AlertSerializer
from notifications.email_service import send_alert_notification
from interventions.models import InterventionCase


# =====================================================
# ALERT LIST & CREATE
# =====================================================
class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Alert.objects.select_related('student', 'subject', 'assigned_to').all().order_by("-alert_date")

        # --------------------------------------------
        # ROLE-BASED ACCESS CONTROL
        # --------------------------------------------
        if user.role == "admin":
            pass  # Admin sees all
        elif user.role == "form_master":
            qs = qs.filter(assigned_to=user)
        elif user.role == "teacher":
            qs = qs.filter(
                subject__teachingassignment__teacher=user
            ).distinct()
        else:
            return Alert.objects.none()

        # --------------------------------------------
        # FILTERING
        # --------------------------------------------
        # Search by student name or ID
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(student__full_name__icontains=search) |
                Q(student__student_id__icontains=search)
            )
        
        # Filter by risk level
        risk_level = self.request.query_params.get('risk_level', '').strip()
        if risk_level:
            qs = qs.filter(risk_level=risk_level)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # Filter by student ID (for specific student)
        student_id = self.request.query_params.get('student', '').strip()
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user

        # Only admin can manually create alerts
        if user.role != "admin":
            raise PermissionDenied("Only admin can manually create alerts.")

        alert = serializer.save(status="active")
        
        # Send automatic email notification for high-risk alerts
        if alert.risk_level in ['high', 'critical']:
            send_alert_notification(alert)


# =====================================================
# ALERT DETAIL & WORKFLOW UPDATE
# =====================================================
class AlertDetailView(IDORProtectionMixin, generics.RetrieveUpdateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    queryset = Alert.objects.select_related('student', 'subject', 'assigned_to').all()
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):

        alert = self.get_object()
        user = request.user
        new_status = request.data.get("status")

        valid_statuses = [
            "active",
            "under_review",
            "escalated",
            "resolved",
            "dismissed",
        ]

        if new_status not in valid_statuses:
            return Response(
                {"error": "Invalid status transition."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # FORM MASTER WORKFLOW
        # -------------------------------------------------
        if user.role == "form_master":

            if alert.assigned_to != user:
                raise PermissionDenied("This alert is not assigned to you.")

            if alert.status == "resolved":
                raise PermissionDenied("Resolved alerts cannot be modified.")

            allowed_transitions = [
                "under_review",
                "escalated",
                "resolved",
            ]

            if new_status not in allowed_transitions:
                raise PermissionDenied("Invalid action for form master.")

            alert.status = new_status

            if new_status == "escalated":
                alert.escalated_to_admin = True
                # Auto-create InterventionCase if none exists for this alert
                if not InterventionCase.objects.filter(alert=alert).exists():
                    InterventionCase.objects.create(
                        student=alert.student,
                        alert=alert,
                        assigned_to=user,
                        status='escalated_to_admin',
                        escalation_reason=f'Auto-created from escalated alert #{alert.alert_id} '
                                          f'(risk: {alert.risk_level}, type: {alert.alert_type})',
                    )

        # -------------------------------------------------
        # ADMIN WORKFLOW
        # -------------------------------------------------
        elif user.role == "admin":

            alert.status = new_status

        # -------------------------------------------------
        # BLOCK EVERYONE ELSE
        # -------------------------------------------------
        else:
            raise PermissionDenied("You do not have permission to update alerts.")

        alert.save()

        response_data = {
            'message': 'Alert updated successfully.',
            'alert': AlertSerializer(alert).data,
        }
        if new_status == 'escalated':
            case = InterventionCase.objects.filter(alert=alert).first()
            if case:
                response_data['intervention_case_id'] = case.case_id
                response_data['case_created'] = True

        return Response(response_data)


# =====================================================
# ALERT HISTORY (RESOLVED ALERTS)
# =====================================================
class AlertHistoryView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        qs = Alert.objects.filter(
            status__in=['resolved', 'dismissed'],
            updated_at__gte=thirty_days_ago
        ).select_related('student', 'subject', 'assigned_to').order_by('-updated_at')

        if user.role == "admin":
            return qs
        elif user.role == "form_master":
            return qs.filter(assigned_to=user)
        elif user.role == "teacher":
            return qs.filter(subject__teachingassignment__teacher=user).distinct()
        
        return Alert.objects.none()
