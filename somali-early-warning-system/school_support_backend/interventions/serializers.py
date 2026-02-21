from rest_framework import serializers
from django.utils import timezone
from .models import InterventionCase, InterventionMeeting, ProgressUpdate


# =====================================================
# PROGRESS UPDATE SERIALIZER
# =====================================================
class ProgressUpdateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ProgressUpdate
        fields = ['id', 'meeting', 'update_text', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']


# =====================================================
# INTERVENTION MEETING SERIALIZER
# =====================================================
class InterventionMeetingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    progress_updates = ProgressUpdateSerializer(many=True, read_only=True)
    progress_count = serializers.SerializerMethodField()
    days_since_meeting = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = InterventionMeeting
        fields = [
            'id', 'student', 'student_name', 'student_id_number',
            'meeting_date', 'absence_reason', 'root_cause', 
            'intervention_notes', 'action_plan', 'follow_up_date',
            'urgency_level', 'status', 'created_by', 'created_by_name',
            'progress_updates', 'progress_count', 'days_since_meeting',
            'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_progress_count(self, obj):
        return obj.progress_updates.count()
    
    def get_days_since_meeting(self, obj):
        delta = timezone.now().date() - obj.meeting_date
        return delta.days
    
    def get_is_overdue(self, obj):
        if obj.follow_up_date and obj.status not in ['closed', 'escalated']:
            return timezone.now().date() > obj.follow_up_date
        return False
    
    def validate(self, data):
        # Validate follow_up_date is in the future
        follow_up_date = data.get('follow_up_date')
        if follow_up_date and follow_up_date < timezone.now().date():
            raise serializers.ValidationError({
                'follow_up_date': 'Follow-up date must be in the future.'
            })
        
        # Validate status transitions
        if self.instance:
            old_status = self.instance.status
            new_status = data.get('status', old_status)
            
            # Cannot reopen closed cases
            if old_status == 'closed' and new_status != 'closed':
                raise serializers.ValidationError({
                    'status': 'Cannot reopen a closed intervention.'
                })
            
            # Cannot escalate closed cases
            if old_status == 'closed' and new_status == 'escalated':
                raise serializers.ValidationError({
                    'status': 'Cannot escalate a closed intervention.'
                })
        
        # Validate student is provided
        if not self.instance and not data.get('student'):
            raise serializers.ValidationError({
                'student': 'Student is required.'
            })
        
        # Check for duplicate active interventions (application-level)
        student = data.get('student') or (self.instance.student if self.instance else None)
        root_cause = data.get('root_cause') or (self.instance.root_cause if self.instance else None)
        status = data.get('status', 'open')
        
        if student and root_cause and status in ['open', 'monitoring', 'improving', 'not_improving', 'escalated']:
            from .models import InterventionMeeting
            existing = InterventionMeeting.objects.filter(
                student=student,
                root_cause=root_cause,
                status__in=['open', 'monitoring', 'improving', 'not_improving', 'escalated']
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f'An active intervention for this root cause already exists for this student. '
                        f'Please close the existing intervention before creating a new one.'
                    ]
                })
        
        return data


# =====================================================
# INTERVENTION CASE SERIALIZER (Existing)
# =====================================================


class InterventionCaseSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True
    )
    
    student__full_name = serializers.CharField(
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
    
    # Add classroom and risk profile
    classroom = serializers.SerializerMethodField()
    student_risk_level = serializers.SerializerMethodField()
    
    def get_classroom(self, obj):
        """Get student's active classroom"""
        if obj.student:
            enrollment = obj.student.enrollments.filter(is_active=True).first()
            if enrollment and enrollment.classroom:
                return enrollment.classroom.name
        return 'Not Enrolled'
    
    def get_student_risk_level(self, obj):
        """Get student's risk level from risk profile"""
        if obj.student and hasattr(obj.student, 'risk_profile') and obj.student.risk_profile:
            return obj.student.risk_profile.risk_level
        return 'low'

    class Meta:
        model = InterventionCase
        fields = [
            "case_id",
            "student",
            "student_name",
            "student__full_name",
            "classroom",
            "student_risk_level",
            "alert",
            "alert_type",
            "risk_level",
            "assigned_to",
            "status",
            "follow_up_date",
            "outcome_notes",
            "resolution_notes",
            "escalation_reason",
            "meeting_date",
            "meeting_notes",
            "progress_status",
            "version",  # ✅ VERSION CONTROL
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "case_id",
            "created_at",
            "updated_at",
            "version",  # Version is managed by model
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
