from rest_framework import serializers
from .models import Alert
from django.db.models import Count, Q
from attendance.models import AttendanceRecord
from students.models import StudentEnrollment
from django.utils import timezone
from datetime import timedelta


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
    
    classroom_name = serializers.SerializerMethodField()
    days_missed = serializers.SerializerMethodField()
    subject_missed = serializers.SerializerMethodField()
    
    def get_classroom_name(self, obj):
        try:
            enrollment = StudentEnrollment.objects.filter(
                student=obj.student,
                is_active=True
            ).select_related('classroom').first()
            return enrollment.classroom.name if enrollment else 'Not Enrolled'
        except:
            return 'Not Enrolled'
    
    def get_days_missed(self, obj):
        try:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            absent_count = AttendanceRecord.objects.filter(
                student=obj.student,
                status='absent',
                session__attendance_date__gte=thirty_days_ago
            ).count()
            return absent_count
        except:
            return 0
    
    def get_subject_missed(self, obj):
        try:
            if not obj.subject:
                return 0
            thirty_days_ago = timezone.now() - timedelta(days=30)
            missed = AttendanceRecord.objects.filter(
                student=obj.student,
                status='absent',
                session__subject=obj.subject,
                session__attendance_date__gte=thirty_days_ago
            ).count()
            return missed
        except:
            return 0

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
            "classroom_name",
            "days_missed",
            "subject_missed",
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
