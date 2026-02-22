"""
Targeted Coverage Tests for interventions/serializers.py
Missing lines: 51, 58, 64-75, 81, 98, 101, 153
"""
import pytest
from rest_framework import serializers
from django.utils import timezone
from datetime import date, timedelta


@pytest.mark.django_db
class TestInterventionSerializersMissingLines:
    """Target specific uncovered branches in serializers.py"""
    
    def test_intervention_meeting_follow_up_date_validation_past_date(self, student):
        """Line 51: Follow-up date validation for past dates"""
        from interventions.serializers import InterventionMeetingSerializer
        
        past_date = date.today() - timedelta(days=1)
        data = {
            'student': student.pk,
            'meeting_date': date.today(),
            'absence_reason': 'Test',
            'root_cause': 'health',
            'intervention_notes': 'Test',
            'action_plan': 'Test',
            'follow_up_date': past_date,
            'urgency_level': 'medium',
            'status': 'open'
        }
        
        serializer = InterventionMeetingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'follow_up_date' in serializer.errors
        assert 'must be in the future' in str(serializer.errors['follow_up_date'])
    
    def test_intervention_meeting_reopen_closed_case_validation(self, student, form_master_user):
        """Lines 58, 64-75: Cannot reopen closed cases"""
        from interventions.models import InterventionMeeting
        from interventions.serializers import InterventionMeetingSerializer
        
        # Create closed meeting
        meeting = InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date=date.today(),
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='closed'
        )
        
        # Try to reopen
        data = {'status': 'open'}
        serializer = InterventionMeetingSerializer(instance=meeting, data=data, partial=True)
        assert not serializer.is_valid()
        assert 'status' in serializer.errors
        assert 'Cannot reopen a closed intervention' in str(serializer.errors['status'])
    
    def test_intervention_meeting_escalate_closed_case_validation(self, student, form_master_user):
        """Lines 64-75: Cannot escalate closed cases"""
        from interventions.models import InterventionMeeting
        from interventions.serializers import InterventionMeetingSerializer
        
        # Create closed meeting
        meeting = InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date=date.today(),
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='closed'
        )
        
        # Try to escalate
        data = {'status': 'escalated'}
        serializer = InterventionMeetingSerializer(instance=meeting, data=data, partial=True)
        assert not serializer.is_valid()
        assert 'status' in serializer.errors
        assert 'Cannot reopen a closed intervention' in str(serializer.errors['status'])
    
    def test_intervention_meeting_student_required_validation(self):
        """Line 81: Student is required for new meetings"""
        from interventions.serializers import InterventionMeetingSerializer
        
        data = {
            'meeting_date': date.today(),
            'absence_reason': 'Test',
            'root_cause': 'health',
            'intervention_notes': 'Test',
            'action_plan': 'Test',
            'urgency_level': 'medium',
            'status': 'open'
        }
        
        serializer = InterventionMeetingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'student' in serializer.errors
        assert 'required' in str(serializer.errors['student'])
    
    def test_intervention_meeting_duplicate_active_intervention_validation(self, student, form_master_user):
        """Lines 98, 101: Duplicate active intervention validation"""
        from interventions.models import InterventionMeeting
        from interventions.serializers import InterventionMeetingSerializer
        
        # Create existing active meeting
        InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date=date.today(),
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        
        # Try to create duplicate
        data = {
            'student': student.pk,
            'meeting_date': date.today(),
            'absence_reason': 'Test 2',
            'root_cause': 'health',  # Same root cause
            'intervention_notes': 'Test 2',
            'action_plan': 'Test 2',
            'urgency_level': 'medium',
            'status': 'open'
        }
        
        serializer = InterventionMeetingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'non_field_errors' in serializer.errors
        assert 'active intervention for this root cause already exists' in str(serializer.errors['non_field_errors'])
    
    def test_intervention_case_get_student_risk_level_no_risk_profile(self, student):
        """Line 153: get_student_risk_level when no risk profile exists"""
        from interventions.serializers import InterventionCaseSerializer
        from interventions.models import InterventionCase
        
        case = InterventionCase.objects.create(
            student=student,
            status='open'
        )
        
        serializer = InterventionCaseSerializer(instance=case)
        # Should return 'low' when no risk profile exists
        assert serializer.data['student_risk_level'] == 'low'