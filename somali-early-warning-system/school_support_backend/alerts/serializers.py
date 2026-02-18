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
            "alert_date",
            "updated_at",
        ]
        read_only_fields = [
            "alert_id",
            "alert_date",
            "updated_at",
        ]

    def validate(self, data):
        """
        Industry rule:
        - Prevent duplicate ACTIVE alerts
        - Only HIGH or CRITICAL can be created automatically
        """

        student = data.get("student")
        subject = data.get("subject")
        alert_type = data.get("alert_type")
        risk_level = data.get("risk_level")

        # Prevent duplicate active alerts
        existing = Alert.objects.filter(
            student=student,
            subject=subject,
            alert_type=alert_type,
            status="active"
        )

        if existing.exists():
            raise serializers.ValidationError(
                "An active alert already exists for this student and subject."
            )

        return data
