"""
Targeted Coverage Tests for interventions/meeting_views.py
Missing lines: 85-88, 91-98, 101-107, 127-128
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestInterventionMeetingViewsMissingLines:
    """Target specific uncovered branches in meeting_views.py"""
    
    def test_progress_update_meeting_not_found(self, authenticated_form_master):
        """Lines 91-98: Meeting not found in ProgressUpdateCreateView"""
        response = authenticated_form_master.post('/api/interventions/meetings/progress/', {
            'meeting': 99999,  # Non-existent meeting ID
            'update_text': 'Test update'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'does not exist' in str(response.data)
    
    def test_progress_update_form_master_cannot_update_others_meeting(self, authenticated_form_master, other_form_master_user, student):
        """Lines 101-107: Form master cannot update others' meetings in ProgressUpdateCreateView"""
        from interventions.models import InterventionMeeting
        
        # Create meeting by other form master
        meeting = InterventionMeeting.objects.create(
            student=student,
            created_by=other_form_master_user,
            meeting_date='2024-01-15',
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        
        response = authenticated_form_master.post('/api/interventions/meetings/progress/', {
            'meeting': meeting.pk,
            'update_text': 'Test update'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'You can only add updates to your own meetings' in str(response.data)
    
    def test_recurring_absence_filter_by_form_master(self, authenticated_form_master, form_master_user, other_form_master_user, student):
        """Lines 85-88: Filter recurring absences by form master"""
        from interventions.models import InterventionMeeting
        from students.models import Student
        
        # Create another student
        other_student = Student.objects.create(
            admission_number='STU002',
            full_name='Jane Smith',
            gender='female',
            is_active=True
        )
        
        # Create meetings by current form master for same student with different root causes
        InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date='2024-01-15',
            absence_reason='Test 1',
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
            absence_reason='Test 2',
            root_cause='family',  # Different root cause
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        
        # Create meeting by other form master (should be filtered out)
        InterventionMeeting.objects.create(
            student=other_student,
            created_by=other_form_master_user,
            meeting_date='2024-01-17',
            absence_reason='Test 3',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        
        response = authenticated_form_master.get('/api/interventions/meetings/recurring/')
        assert response.status_code == status.HTTP_200_OK
        # Should only see meetings created by current form master
        assert len(response.data['recurring_students']) >= 1
    
    def test_dashboard_stats_filter_by_form_master(self, authenticated_form_master, form_master_user, other_form_master_user, student):
        """Lines 127-128: Filter dashboard stats by form master"""
        from interventions.models import InterventionMeeting
        from students.models import Student
        
        # Create another student
        other_student = Student.objects.create(
            admission_number='STU003',
            full_name='Bob Johnson',
            gender='male',
            is_active=True
        )
        
        # Create meeting by current form master
        InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date='2024-01-15',
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='high',
            status='open'
        )
        
        # Create meeting by other form master (should be filtered out)
        InterventionMeeting.objects.create(
            student=other_student,
            created_by=other_form_master_user,
            meeting_date='2024-01-16',
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='high',
            status='open'
        )
        
        response = authenticated_form_master.get('/api/interventions/meetings/stats/')
        assert response.status_code == status.HTTP_200_OK
        # Should only count meetings created by current form master
        assert response.data['total_meetings'] == 1
        assert response.data['high_urgency'] == 1