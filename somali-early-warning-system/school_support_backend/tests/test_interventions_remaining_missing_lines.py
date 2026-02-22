"""
Surgical Coverage Tests for Remaining Interventions Missing Lines
Target: Specific uncovered branches to reach 75%+
"""
import pytest
from rest_framework import status
from unittest.mock import patch


@pytest.mark.django_db
class TestInterventionsRemainingMissingLines:
    """Target remaining uncovered branches in interventions module"""
    
    def test_dashboard_view_line_107_non_form_master_access(self, authenticated_admin):
        """interventions/dashboard_view.py line 107: Non-form master access"""
        # Admin trying to access form master dashboard should be denied
        response = authenticated_admin.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['error'] == 'Access denied'
    
    def test_dashboard_view_lines_120_130_trend_calculation(self, authenticated_form_master, form_master_user, student):
        """interventions/dashboard_view.py lines 120-130: Trend calculation with previous cases"""
        from interventions.models import InterventionCase
        from django.utils import timezone
        from datetime import timedelta
        
        # Create cases in previous month to trigger trend calculation
        prev_month = timezone.now() - timedelta(days=45)
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='closed',
            created_at=prev_month
        )
        
        # Create case in last month
        last_month = timezone.now() - timedelta(days=15)
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open',
            created_at=last_month
        )
        
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        # Should trigger trend calculation with non-zero previous cases
        assert 'trends' in response.data['statistics']
    
    def test_meeting_views_lines_85_88_recurring_filter(self, authenticated_form_master, form_master_user, student):
        """interventions/meeting_views.py lines 85-88: Recurring absence filter by form master"""
        from interventions.models import InterventionMeeting
        from students.models import Student
        
        # Create another student for other form master
        other_student = Student.objects.create(
            admission_number='STU999',
            full_name='Other Student',
            gender='male'
        )
        
        # Create multiple meetings for same student (different root causes)
        InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date='2024-01-15',
            absence_reason='Health issue',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date='2024-01-16',
            absence_reason='Family issue',
            root_cause='family',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        
        response = authenticated_form_master.get('/api/interventions/meetings/recurring/')
        assert response.status_code == status.HTTP_200_OK
        # Should filter by form master (lines 85-88)
        assert len(response.data['recurring_students']) >= 1
    
    def test_serializers_line_51_follow_up_date_past(self, student):
        """interventions/serializers.py line 51: Follow-up date in past validation"""
        from interventions.serializers import InterventionMeetingSerializer
        from datetime import date, timedelta
        
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
    
    def test_serializers_lines_74_75_escalate_closed_validation(self, student, form_master_user):
        """interventions/serializers.py lines 74-75: Cannot escalate closed intervention"""
        from interventions.models import InterventionMeeting
        from interventions.serializers import InterventionMeetingSerializer
        from datetime import date
        
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
        
        # Try to escalate closed meeting
        data = {'status': 'escalated'}
        serializer = InterventionMeetingSerializer(instance=meeting, data=data, partial=True)
        assert not serializer.is_valid()
        assert 'status' in serializer.errors
    
    def test_serializers_line_81_student_required(self):
        """interventions/serializers.py line 81: Student required validation"""
        from interventions.serializers import InterventionMeetingSerializer
        from datetime import date
        
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
    
    def test_serializers_line_98_duplicate_intervention_check(self, student, form_master_user):
        """interventions/serializers.py line 98: Duplicate active intervention check"""
        from interventions.models import InterventionMeeting
        from interventions.serializers import InterventionMeetingSerializer
        from datetime import date
        
        # Create existing active meeting
        InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date=date.today(),
            absence_reason='Existing',
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
            'absence_reason': 'Duplicate',
            'root_cause': 'health',  # Same root cause
            'intervention_notes': 'Test',
            'action_plan': 'Test',
            'urgency_level': 'medium',
            'status': 'open'
        }
        
        serializer = InterventionMeetingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'non_field_errors' in serializer.errors