from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import AttendanceSession
from .serializers import AttendanceSessionSerializer

from academics.models import TeachingAssignment
from risk.services import update_risk_after_session


# -----------------------------------
# Attendance Session Create & List
# -----------------------------------
class AttendanceSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return AttendanceSession.objects.all().order_by("-attendance_date")

        if user.role == "teacher":
            return AttendanceSession.objects.filter(
                teacher=user
            ).order_by("-attendance_date")

        if user.role == "form_master":
            return AttendanceSession.objects.filter(
                classroom__form_master=user
            ).order_by("-attendance_date")

        return AttendanceSession.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "teacher":
            raise PermissionDenied("Only teachers can record attendance.")

        classroom = serializer.validated_data["classroom"]
        subject = serializer.validated_data["subject"]
        attendance_date = serializer.validated_data["attendance_date"]

        # Validate teacher assignment
        if not TeachingAssignment.objects.filter(
            teacher=user,
            subject=subject,
            classroom=classroom
        ).exists():
            raise PermissionDenied("You are not assigned to this class/subject.")

        # Prevent duplicate session
        if AttendanceSession.objects.filter(
            classroom=classroom,
            subject=subject,
            attendance_date=attendance_date
        ).exists():
            raise PermissionDenied(
                "Attendance already recorded for this class, subject and date."
            )

        # Save session
        session = serializer.save(teacher=user)

        # 🔥 Call risk engine (SERVICE LAYER)
        update_risk_after_session(session)


# -----------------------------------
# Attendance Session Detail
# -----------------------------------
class AttendanceSessionDetailView(generics.RetrieveAPIView):
    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]
