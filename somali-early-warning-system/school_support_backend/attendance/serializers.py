from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from .models import AttendanceSession, AttendanceRecord
from academics.models import TeachingAssignment
from students.models import StudentEnrollment, Student


# -----------------------------------
# Attendance Record Serializer for Reading
# -----------------------------------
class AttendanceRecordReadSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    student_admission = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "record_id",
            "student",
            "student_name",
            "student_id_number", 
            "student_admission",
            "status",
            "remarks",
        ]


# -----------------------------------
# Attendance Record Serializer for Writing
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
    records = AttendanceRecordSerializer(many=True, required=False)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            "session_id",
            "classroom",
            "classroom_name",
            "subject",
            "subject_name",
            "teacher",
            "teacher_name",
            "attendance_date",
            "created_at",
            "records",
            "total_students",
        ]
        read_only_fields = ["session_id", "teacher", "created_at", "classroom_name", "subject_name", "teacher_name", "total_students"]

    def get_total_students(self, obj):
        return obj.records.count()

    def to_representation(self, instance):
        """Override to ensure records are included for reading"""
        data = super().to_representation(instance)
        # Force include records with full student data for reading
        records = AttendanceRecordReadSerializer(instance.records.all(), many=True).data
        data['records'] = records
        return data

    def validate(self, data):
        request = self.context["request"]
        user = request.user

        if user.role != "teacher":
            raise PermissionDenied(
                "Only teachers can record attendance."
            )

        # Skip validation for updates
        if self.instance:
            return data

        classroom = data.get("classroom")
        subject = data.get("subject")
        records = data.get("records")

        # Validate teacher assignment
        if not TeachingAssignment.objects.filter(
            teacher=user,
            subject=subject,
            classroom=classroom
        ).exists():
            raise PermissionDenied(
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
        validated_data['teacher'] = teacher

        session = AttendanceSession.objects.create(**validated_data)

        for record_data in records_data:
            AttendanceRecord.objects.create(
                session=session,
                student=record_data["student"],
                status=record_data["status"],
                remarks=record_data.get("remarks", "")
            )

        return session

    def update(self, instance, validated_data):
        records_data = validated_data.pop("records", None)

        if records_data:
            # Delete old records
            instance.records.all().delete()

            # Create new records
            for record_data in records_data:
                AttendanceRecord.objects.create(
                    session=instance,
                    student=record_data["student"],
                    status=record_data["status"],
                    remarks=record_data.get("remarks", "")
                )

        # Force update of risk calculations after attendance change
        from risk.services import update_risk_after_session
        try:
            update_risk_after_session(instance)
        except Exception as e:
            print(f"Risk update failed: {e}")

        return instance
