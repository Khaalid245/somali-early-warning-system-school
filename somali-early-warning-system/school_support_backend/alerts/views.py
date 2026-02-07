from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Alert
from .serializers import AlertSerializer


class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Alert.objects.all().order_by("-alert_date")

        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    def perform_create(self, serializer):
        user = self.request.user

        # Only admin or counsellor can create alerts
        if user.role not in ["admin", "counsellor"]:
            raise PermissionDenied("You are not allowed to create alerts.")

        alert_type = serializer.validated_data.get("alert_type")
        student = serializer.validated_data.get("student")
        subject = serializer.validated_data.get("subject")

        # Prevent duplicate active alerts for same student + subject + type
        existing = Alert.objects.filter(
            student=student,
            subject=subject,
            alert_type=alert_type,
            status="active"
        )

        if existing.exists():
            return existing.first()

        serializer.save(status="active")


class AlertDetailView(generics.RetrieveUpdateAPIView):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        alert = self.get_object()
        user = request.user

        # Only admin or counsellor can update alert status
        if user.role not in ["admin", "counsellor"]:
            return Response(
                {"error": "You do not have permission to update alerts."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get("status")

        if new_status not in ["active", "resolved", "dismissed"]:
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        alert.status = new_status
        alert.save()

        return Response({
            "message": "Alert status updated",
            "alert": AlertSerializer(alert).data
        })
