"""
Interventions Meeting Views Coverage Tests
Target: 31% → 70%
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestInterventionMeetingListCreateView:
    
    def test_form_master_can_list(self, authenticated_form_master):
        """Happy path: Form master can list meetings"""
        response = authenticated_form_master.get('/api/interventions/meetings/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_teacher_cannot_list(self, authenticated_teacher):
        """Permission: Teacher cannot list meetings"""
        response = authenticated_teacher.get('/api/interventions/meetings/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0
    
    def test_form_master_can_create(self, authenticated_form_master, student):
        """Happy path: Form master can create meeting"""
        response = authenticated_form_master.post('/api/interventions/meetings/', {
            'student': student.student_id,
            'meeting_date': '2024-01-15',
            'absence_reason': 'Frequent absences',
            'root_cause': 'health',
            'intervention_notes': 'Discussed with student',
            'action_plan': 'Follow up next week',
            'urgency_level': 'medium',
            'status': 'open'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_teacher_cannot_create(self, authenticated_teacher, student):
        """Permission: Teacher cannot create meeting"""
        response = authenticated_teacher.post('/api/interventions/meetings/', {
            'student': student.student_id,
            'meeting_date': '2024-01-15',
            'absence_reason': 'Test',
            'root_cause': 'health',
            'intervention_notes': 'Test',
            'action_plan': 'Test'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_filter_by_status(self, authenticated_form_master):
        """Branch: Filter by status"""
        response = authenticated_form_master.get('/api/interventions/meetings/?status=open')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_urgency(self, authenticated_form_master):
        """Branch: Filter by urgency"""
        response = authenticated_form_master.get('/api/interventions/meetings/?urgency=high')
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_by_student(self, authenticated_form_master, student):
        """Branch: Filter by student"""
        response = authenticated_form_master.get(f'/api/interventions/meetings/?student={student.student_id}')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestInterventionMeetingDetailView:
    
    def test_form_master_can_retrieve_own(self, authenticated_form_master, form_master_user, student):
        """Happy path: Form master can retrieve own meeting"""
        from interventions.models import InterventionMeeting
        meeting = InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date='2024-01-15',
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        response = authenticated_form_master.get(f'/api/interventions/meetings/{meeting.pk}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_form_master_cannot_update_others(self, authenticated_form_master, other_form_master_user, student):
        """Permission: Form master cannot update others' meetings"""
        from interventions.models import InterventionMeeting
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
        response = authenticated_form_master.patch(f'/api/interventions/meetings/{meeting.pk}/', {
            'status': 'closed'
        }, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_form_master_cannot_delete_others(self, authenticated_form_master, other_form_master_user, student):
        """Permission: Form master cannot delete others' meetings"""
        from interventions.models import InterventionMeeting
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
        response = authenticated_form_master.delete(f'/api/interventions/meetings/{meeting.pk}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_meeting_not_found(self, authenticated_form_master):
        """Not found: Non-existent meeting"""
        response = authenticated_form_master.get('/api/interventions/meetings/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestProgressUpdateCreateView:
    
    def test_form_master_can_add_update(self, authenticated_form_master, form_master_user, student):
        """Happy path: Form master can add progress update"""
        from interventions.models import InterventionMeeting
        meeting = InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
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
            'update_text': 'Student showing improvement'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_teacher_cannot_add_update(self, authenticated_teacher, form_master_user, student):
        """Permission: Teacher cannot add progress update"""
        from interventions.models import InterventionMeeting
        meeting = InterventionMeeting.objects.create(
            student=student,
            created_by=form_master_user,
            meeting_date='2024-01-15',
            absence_reason='Test',
            root_cause='health',
            intervention_notes='Test',
            action_plan='Test',
            urgency_level='medium',
            status='open'
        )
        response = authenticated_teacher.post('/api/interventions/meetings/progress/', {
            'meeting': meeting.pk,
            'update_text': 'Test'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_cannot_update_others_meeting(self, authenticated_form_master, other_form_master_user, student):
        """Permission: Form master cannot add update to others' meeting"""
        from interventions.models import InterventionMeeting
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
            'update_text': 'Test'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestStudentInterventionHistoryView:
    
    def test_form_master_can_view_history(self, authenticated_form_master, student):
        """Happy path: Form master can view student history"""
        response = authenticated_form_master.get(f'/api/interventions/meetings/student/{student.student_id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_teacher_cannot_view_history(self, authenticated_teacher, student):
        """Permission: Teacher cannot view history"""
        response = authenticated_teacher.get(f'/api/interventions/meetings/student/{student.student_id}/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0


@pytest.mark.django_db
class TestRecurringAbsenceDetectionView:
    
    def test_form_master_can_access(self, authenticated_form_master):
        """Happy path: Form master can access recurring detection"""
        response = authenticated_form_master.get('/api/interventions/meetings/recurring/')
        assert response.status_code == status.HTTP_200_OK
        assert 'recurring_students' in response.data
    
    def test_teacher_denied(self, authenticated_teacher):
        """Permission: Teacher cannot access"""
        response = authenticated_teacher.get('/api/interventions/meetings/recurring/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestInterventionDashboardStatsView:
    
    def test_form_master_can_access(self, authenticated_form_master):
        """Happy path: Form master can access stats"""
        response = authenticated_form_master.get('/api/interventions/meetings/stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_meetings' in response.data
    
    def test_teacher_denied(self, authenticated_teacher):
        """Permission: Teacher cannot access stats"""
        response = authenticated_teacher.get('/api/interventions/meetings/stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
