from rest_framework import serializers
from .models import InterventionCase


class InterventionCaseSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )

    alert_type = serializers.CharField(
        source="alert.alert_type",
        read_only=True
    )

    risk_level = serializers.CharField(
        source="alert.risk_level",
        read_only=True
    )

    class Meta:
        model = InterventionCase
        fields = [
            "case_id",
            "student",
            "student_name",
            "alert",
            "alert_type",
            "risk_level",
            "assigned_to",
            "status",
            "follow_up_date",
            "outcome_notes",
            "resolution_notes",   # ✅ NEW FIELD
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "case_id",
            "created_at",
            "updated_at",
        ]

    # =====================================================
    # 🔥 INDUSTRY WORKFLOW VALIDATION
    # =====================================================
    def validate(self, data):
        """
        If case is being closed,
        resolution_notes must be provided.
        """

        status = data.get("status", None)
        resolution_notes = data.get("resolution_notes")

        # If updating existing instance
        if self.instance:
            status = data.get("status", self.instance.status)
            resolution_notes = data.get(
                "resolution_notes",
                self.instance.resolution_notes
            )

        if status == "closed" and not resolution_notes:
            raise serializers.ValidationError(
                "Resolution notes are required when closing a case."
            )

        return data
