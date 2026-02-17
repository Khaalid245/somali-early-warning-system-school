from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord
from academics.models import TeachingAssignment
from students.models import StudentEnrollment


# -----------------------------------
# Attendance Record Serializer
# -----------------------------------
class AttendanceRecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceRecord
        fields = [
            "record_id",
            "student",
            "status",
            "remarks",
        ]
        read_only_fields = ["record_id"]


# -----------------------------------
# Attendance Session Serializer
# -----------------------------------
class AttendanceSessionSerializer(serializers.ModelSerializer):

    records = AttendanceRecordSerializer(many=True)

    class Meta:
        model = AttendanceSession
        fields = [
            "session_id",
            "classroom",
            "subject",
            "teacher",
            "attendance_date",
            "created_at",
            "records",
        ]
        read_only_fields = ["session_id", "teacher", "created_at"]

    def validate(self, data):
        request = self.context["request"]
        user = request.user

        if user.role != "teacher":
            raise serializers.ValidationError(
                "Only teachers can record attendance."
            )

        classroom = data.get("classroom")
        subject = data.get("subject")
        records = data.get("records")

        # Validate teacher assignment
        if not TeachingAssignment.objects.filter(
            teacher=user,
            subject=subject,
            classroom=classroom
        ).exists():
            raise serializers.ValidationError(
                "You are not assigned to this class and subject."
            )

        # Get active enrolled students
        enrolled_students = StudentEnrollment.objects.filter(
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        ).values_list("student_id", flat=True)

        enrolled_set = set(enrolled_students)

        # Extract submitted student IDs
        submitted_ids = [record["student"].student_id for record in records]
        submitted_set = set(submitted_ids)

        # 1️⃣ No duplicate students
        if len(submitted_ids) != len(submitted_set):
            raise serializers.ValidationError(
                "Duplicate students detected in attendance records."
            )

        # 2️⃣ Must match exactly enrolled students
        if submitted_set != enrolled_set:
            raise serializers.ValidationError(
                "Attendance must be submitted for ALL enrolled students."
            )

        return data

    def create(self, validated_data):
        records_data = validated_data.pop("records")
        teacher = self.context["request"].user

        session = AttendanceSession.objects.create(
            teacher=teacher,
            **validated_data
        )

        for record_data in records_data:
            AttendanceRecord.objects.create(
                session=session,
                student=record_data["student"],
                status=record_data["status"],
                remarks=record_data.get("remarks", "")
            )

        return session
