from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Alert
from .serializers import AlertSerializer


# -------------------------------------------------
# ALERT LIST & CREATE
# -------------------------------------------------
class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        qs = Alert.objects.all().order_by("-alert_date")

        # 🔐 Role-based filtering
        if user.role == "admin":
            pass  # Admin sees everything

        elif user.role == "counsellor":
            qs = qs.filter(status__in=["active", "under_review", "escalated"])

        elif user.role == "form_master":
            qs = qs.filter(student__enrollments__classroom__form_master=user)

        elif user.role == "teacher":
            qs = qs.filter(subject__teachingassignment__teacher=user)

        else:
            return Alert.objects.none()

        # 🔍 Optional filtering
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        risk_level = self.request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(risk_level=risk_level)

        return qs.distinct()

    def perform_create(self, serializer):
        user = self.request.user

        # 🔐 Only admin or counsellor can manually create alerts
        if user.role not in ["admin", "counsellor"]:
            raise PermissionDenied("You are not allowed to create alerts.")

        student = serializer.validated_data.get("student")
        subject = serializer.validated_data.get("subject")
        alert_type = serializer.validated_data.get("alert_type")
        risk_level = serializer.validated_data.get("risk_level")

        # 🚫 Prevent duplicate ACTIVE alerts
        existing = Alert.objects.filter(
            student=student,
            subject=subject,
            alert_type=alert_type,
            status="active"
        )

        if existing.exists():
            raise PermissionDenied("An active alert already exists for this case.")

        serializer.save(status="active")


# -------------------------------------------------
# ALERT DETAIL & UPDATE
# -------------------------------------------------
class AlertDetailView(generics.RetrieveUpdateAPIView):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        alert = self.get_object()
        user = request.user

        # 🔐 Only admin or counsellor can update alerts
        if user.role not in ["admin", "counsellor"]:
            return Response(
                {"error": "You do not have permission to update alerts."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get("status")

        valid_statuses = ["active", "under_review", "escalated", "resolved", "dismissed"]

        if new_status not in valid_statuses:
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        alert.status = new_status
        alert.save()

        return Response({
            "message": "Alert status updated successfully",
            "alert": AlertSerializer(alert).data
        })
