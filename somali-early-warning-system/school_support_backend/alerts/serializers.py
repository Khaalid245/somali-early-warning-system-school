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
    missed_classes_detail = serializers.SerializerMethodField()
    consecutive_absences = serializers.SerializerMethodField()
    full_days_missed = serializers.SerializerMethodField()
    
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
    
    def get_missed_classes_detail(self, obj):
        """Get detailed list of all missed classes by subject"""
        try:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            # Get all absent records grouped by subject
            absent_records = AttendanceRecord.objects.filter(
                student=obj.student,
                status='absent',
                session__attendance_date__gte=thirty_days_ago
            ).select_related('session__subject', 'session__classroom').order_by('-session__attendance_date')
            
            # Group by subject
            subjects_missed = {}
            for record in absent_records:
                subject_name = record.session.subject.name if record.session.subject else 'General'
                if subject_name not in subjects_missed:
                    subjects_missed[subject_name] = {
                        'count': 0,
                        'dates': [],
                        'classroom': record.session.classroom.name if record.session.classroom else 'Unknown'
                    }
                subjects_missed[subject_name]['count'] += 1
                subjects_missed[subject_name]['dates'].append(
                    record.session.attendance_date.strftime('%Y-%m-%d')
                )
            
            # Convert to list format
            return [
                {
                    'subject': subject,
                    'classes_missed': data['count'],
                    'classroom': data['classroom'],
                    'recent_dates': data['dates'][:5]  # Last 5 dates
                }
                for subject, data in subjects_missed.items()
            ]
        except Exception as e:
            print(f"Error getting missed classes detail: {e}")
            return []
    
    def get_consecutive_absences(self, obj):
        """Calculate current consecutive absence streak"""
        try:
            # Get recent records ordered by date descending
            recent_records = AttendanceRecord.objects.filter(
                student=obj.student
            ).select_related('session').order_by('-session__attendance_date', '-created_at')[:20]
            
            consecutive = 0
            for record in recent_records:
                if record.status == 'absent':
                    consecutive += 1
                else:
                    break
            
            return consecutive
        except:
            return 0
    
    def get_full_days_missed(self, obj):
        """Get dates where student missed ALL classes that day"""
        try:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            # Get all attendance dates in last 30 days
            from django.db.models import Count, Q
            
            dates_with_attendance = AttendanceRecord.objects.filter(
                student=obj.student,
                session__attendance_date__gte=thirty_days_ago
            ).values('session__attendance_date').annotate(
                total=Count('record_id'),
                absent=Count('record_id', filter=Q(status='absent'))
            )
            
            # Find dates where all records are absent
            full_days = []
            for date_data in dates_with_attendance:
                if date_data['total'] == date_data['absent'] and date_data['absent'] > 0:
                    full_days.append(date_data['session__attendance_date'].strftime('%Y-%m-%d'))
            
            return full_days
        except Exception as e:
            print(f"Error getting full days missed: {e}")
            return []

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
            "missed_classes_detail",
            "consecutive_absences",
            "full_days_missed",
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
