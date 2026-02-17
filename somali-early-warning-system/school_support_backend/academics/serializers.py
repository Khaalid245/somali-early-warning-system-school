from rest_framework import serializers
from .models import Subject, TeachingAssignment


class SubjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subject
        fields = ["subject_id", "name", "created_at"]
        read_only_fields = ["subject_id", "created_at"]


class TeachingAssignmentSerializer(serializers.ModelSerializer):

    teacher_name = serializers.CharField(source="teacher.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)

    class Meta:
        model = TeachingAssignment
        fields = [
            "assignment_id",
            "teacher",
            "teacher_name",
            "subject",
            "subject_name",
            "classroom",
            "classroom_name",
            "created_at",
        ]
        read_only_fields = ["assignment_id", "created_at"]

    def validate(self, data):
        """
        Prevent duplicate teaching assignments
        """
        teacher = data.get("teacher")
        subject = data.get("subject")
        classroom = data.get("classroom")

        if TeachingAssignment.objects.filter(
            teacher=teacher,
            subject=subject,
            classroom=classroom
        ).exists():
            raise serializers.ValidationError(
                "This teaching assignment already exists."
            )

        return data
