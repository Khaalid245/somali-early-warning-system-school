from rest_framework import serializers
from .models import CounsellingSession


class CounsellingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CounsellingSession
        fields = [
            "session_id",
            "session_date",
            "issues_identified",
            "notes",
            "progress_status",
            "admin_notified",
            "student",
            "subject",
            "counsellor",
        ]
        read_only_fields = ["session_id", "admin_notified"]
