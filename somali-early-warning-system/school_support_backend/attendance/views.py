from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Attendance
from .serializers import AttendanceSerializer

from risk.models import RiskProfile
from alerts.models import Alert
from academics.models import TeachingAssignment


class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Attendance.objects.all().order_by("-attendance_date")

        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(attendance_date=date)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        student = serializer.validated_data["student"]
        subject = serializer.validated_data["subject"]
        attendance_date = serializer.validated_data["attendance_date"]
        status = serializer.validated_data["status"].lower()

        if user.role != "teacher":
            raise PermissionDenied("Only teachers can record attendance.")

        if not TeachingAssignment.objects.filter(
            teacher=user,
            subject=subject,
            classroom=student.classroom
        ).exists():
            raise PermissionDenied("You are not assigned to teach this subject for this class.")

        # DB already enforces uniqueness, but we give a clean message
        if Attendance.objects.filter(
            student=student,
            subject=subject,
            attendance_date=attendance_date
        ).exists():
            raise PermissionDenied("Attendance already exists for this student, subject and date.")

        attendance = serializer.save(recorded_by=user)

        self.update_risk(student, subject, status)

        return attendance

    def update_risk(self, student, subject, status):
        risk, _ = RiskProfile.objects.get_or_create(student=student)

        if status == "absent":
            risk.risk_score += 15
        elif status == "late":
            risk.risk_score += 5
        else:
            risk.risk_score = max(risk.risk_score - 5, 0)

        if risk.risk_score >= 60:
            new_level = "high"
        elif risk.risk_score >= 30:
            new_level = "medium"
        else:
            new_level = "low"

        old_level = risk.risk_level
        risk.risk_level = new_level
        risk.save()

        if new_level == "high" and old_level != "high":
            Alert.objects.get_or_create(
                student=student,
                alert_type=f"High Risk in {subject.name}",
                defaults={"risk_level": new_level, "status": "active"}
            )


class AttendanceRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
