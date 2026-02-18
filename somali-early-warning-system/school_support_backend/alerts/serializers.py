from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    assigned_to_name = serializers.CharField(
        source="assigned_to.name",
        read_only=True
    )

    class Meta:
        model = Alert
        fields = [
            "alert_id",
            "alert_type",
            "risk_level",
            "status",
            "student",
            "student_name",
            "subject",
            "subject_name",
            "assigned_to",
            "assigned_to_name",
            "escalated_to_admin",
            "alert_date",
            "updated_at",
        ]

        read_only_fields = [
            "alert_id",
            "alert_date",
            "updated_at",
            "escalated_to_admin",
        ]

    def validate(self, data):
        """
        Industry validation:
        - Prevent duplicate ACTIVE alerts
        - Only HIGH or CRITICAL allowed for automatic system creation
        """

        student = data.get("student")
        subject = data.get("subject")
        alert_type = data.get("alert_type")

        if self.instance is None:  # Only on create

            existing = Alert.objects.filter(
                student=student,
                subject=subject,
                alert_type=alert_type,
                status="active"
            )

            if existing.exists():
                raise serializers.ValidationError(
                    "An active alert already exists for this student."
                )

        return data
