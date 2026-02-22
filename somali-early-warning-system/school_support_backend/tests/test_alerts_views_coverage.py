"""
Test Coverage for alerts/views.py
Target: 51% → 85%+
Strategy: Cover uncovered role-based and workflow branches
"""
import pytest
from rest_framework import status
from alerts.models import Alert


@pytest.mark.django_db
class TestAlertListCreateView:
    """Cover AlertListCreateView uncovered branches"""
    
    def test_teacher_cannot_create_alert(self, authenticated_teacher, student, subject):
        """Branch: if user.role != 'admin' in perform_create"""
        data = {
            'student': student.student_id,
            'subject': subject.subject_id,
            'alert_type': 'attendance',
            'risk_level': 'high'
        }
        response = authenticated_teacher.post('/api/alerts/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_cannot_create_alert(self, authenticated_form_master, student, subject):
        """Branch: Only admin can create alerts"""
        data = {
            'student': student.student_id,
            'subject': subject.subject_id,
            'alert_type': 'attendance',
            'risk_level': 'high'
        }
        response = authenticated_form_master.post('/api/alerts/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAlertDetailView:
    """Cover AlertDetailView uncovered branches"""
    
    def test_form_master_cannot_update_unassigned_alert(self, authenticated_form_master, student, subject, other_form_master_user):
        """Branch: if alert.assigned_to != user"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=other_form_master_user,
            status='active'
        )
        
        response = authenticated_form_master.patch(
            f'/api/alerts/{alert.pk}/',
            {'status': 'under_review'}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_cannot_modify_resolved_alert(self, authenticated_form_master, student, subject, form_master_user):
        """Branch: if alert.status == 'resolved'"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='resolved'
        )
        
        response = authenticated_form_master.patch(
            f'/api/alerts/{alert.pk}/',
            {'status': 'active'}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_invalid_status_transition_rejected(self, authenticated_form_master, student, subject, form_master_user):
        """Branch: if new_status not in allowed_transitions"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        response = authenticated_form_master.patch(
            f'/api/alerts/{alert.pk}/',
            {'status': 'dismissed'}  # Not allowed for form master
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_escalate_sets_flag(self, authenticated_form_master, student, subject, form_master_user):
        """Branch: if new_status == 'escalated'"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        response = authenticated_form_master.patch(
            f'/api/alerts/{alert.pk}/',
            {'status': 'escalated'}
        )
        assert response.status_code == status.HTTP_200_OK
        
        alert.refresh_from_db()
        assert alert.escalated_to_admin is True
    
    def test_admin_can_update_any_alert(self, authenticated_admin, student, subject, form_master_user):
        """Branch: elif user.role == 'admin'"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        response = authenticated_admin.patch(
            f'/api/alerts/{alert.pk}/',
            {'status': 'dismissed'}
        )
        assert response.status_code == status.HTTP_200_OK
        
        alert.refresh_from_db()
        assert alert.status == 'dismissed'
    
    def test_invalid_status_value_rejected(self, authenticated_admin, student, subject, form_master_user):
        """Branch: if new_status not in valid_statuses"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        response = authenticated_admin.patch(
            f'/api/alerts/{alert.pk}/',
            {'status': 'invalid_status'}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Invalid status' in response.data['error']
