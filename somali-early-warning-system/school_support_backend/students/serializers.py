from rest_framework import serializers
from .models import Classroom, Student, StudentEnrollment


# -----------------------------------
# CLASSROOM SERIALIZER
# -----------------------------------
class ClassroomSerializer(serializers.ModelSerializer):

    class Meta:
        model = Classroom
        fields = [
            "class_id",
            "name",
            "academic_year",
            "form_master",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "class_id",
            "created_at",
            "updated_at",
        ]


# -----------------------------------
# STUDENT SERIALIZER
# -----------------------------------
class StudentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Student
        fields = [
            "student_id",
            "admission_number",
            "full_name",
            "gender",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "student_id",
            "created_at",
            "updated_at",
        ]


# -----------------------------------
# STUDENT ENROLLMENT SERIALIZER
# -----------------------------------
class StudentEnrollmentSerializer(serializers.ModelSerializer):

    # Nested read-only display
    student_details = StudentSerializer(source="student", read_only=True)
    classroom_details = ClassroomSerializer(source="classroom", read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            "enrollment_id",
            "student",
            "student_details",
            "classroom",
            "classroom_details",
            "academic_year",
            "enrollment_date",
            "is_active",
        ]
        read_only_fields = [
            "enrollment_id",
            "enrollment_date",
        ]

    # ----------------------------
    # VALIDATION:
    # Prevent duplicate active enrollment
    # ----------------------------
    def validate(self, data):
        student = data.get("student")
        academic_year = data.get("academic_year")

        existing = StudentEnrollment.objects.filter(
            student=student,
            academic_year=academic_year,
            is_active=True
        )

        # If updating, exclude current instance
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                "Student already has an active enrollment for this academic year."
            )

        return data
