from rest_framework import serializers
from .models import Attendance
from academics.models import TeachingAssignment


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = [
            "attendance_id",
            "attendance_date",
            "status",
            "remarks",
            "student",
            "subject",
            "recorded_by",
        ]
        read_only_fields = ["attendance_id", "recorded_by"]

    def validate(self, data):
        """
        Allow:
        - POST → student + subject required
        - PATCH → only status/remarks allowed
        """

        request = self.context["request"]
        teacher = request.user

        # PATCH requests must not re-validate student/subject
        if request.method in ["PATCH", "PUT"]:
            return data

        # For CREATE only
        student = data.get("student")
        subject = data.get("subject")

        if teacher.role != "teacher":
            raise serializers.ValidationError("Only teachers can record attendance.")

        if not student or not subject:
            raise serializers.ValidationError("Student and subject are required.")

        assigned = TeachingAssignment.objects.filter(
            teacher=teacher,
            subject=subject,
            classroom=student.classroom
        ).exists()

        if not assigned:
            raise serializers.ValidationError(
                "You are not assigned to teach this subject in this student's class."
            )

        return data
