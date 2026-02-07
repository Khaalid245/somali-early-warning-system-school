from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = [
            "alert_id",
            "alert_type",
            "alert_date",
            "risk_level",
            "status",
            "student",
            "subject",
        ]
        read_only_fields = ["alert_id", "alert_date"]
