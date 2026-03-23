from rest_framework import serializers
from .models import StudentRiskProfile, SubjectRiskInsight


# -----------------------------------
# OVERALL STUDENT RISK SERIALIZER
# -----------------------------------
class StudentRiskProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentRiskProfile
        fields = [
            "id",
            "student",
            "risk_score",
            "risk_level",
            "last_calculated",
            "created_at",
        ]
        read_only_fields = fields


# -----------------------------------
# SUBJECT RISK INSIGHT SERIALIZER
# -----------------------------------
class SubjectRiskInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectRiskInsight
        fields = [
            "id",
            "student",
            "subject",
            # Session-level (raw data)
            "total_sessions",
            "absence_count",
            "late_count",
            "absence_rate",
            # Day-based (UK standard — use these for display)
            "total_days",
            "absent_days",
            "late_days",
            "day_absence_rate",
            "last_calculated",
            "created_at",
        ]
        read_only_fields = fields
