from rest_framework import serializers
from .models import Intervention
from academics.models import Subject


class InterventionSerializer(serializers.ModelSerializer):
    alert_type = serializers.CharField(source="alert.alert_type", read_only=True)
    student_name = serializers.CharField(source="session.student.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = Intervention
        fields = [
            "intervention_id",
            "description",
            "due_date",
            "status",
            "created_at",
            "session",
            "alert",
            "subject",
            "assigned_to",
            "alert_type",
            "student_name",
            "subject_name",
        ]
        read_only_fields = ["intervention_id", "created_at", "status"]
