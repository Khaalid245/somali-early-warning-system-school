"""
Interventions Dashboard View Coverage Tests
Target: 27% → 75%
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestFormMasterDashboardView:
    
    def test_form_master_access(self, authenticated_form_master):
        """Happy path: Form master can access dashboard"""
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert 'pending_cases' in response.data
        assert 'statistics' in response.data
    
    def test_admin_denied(self, authenticated_admin):
        """Permission: Admin cannot access form master dashboard"""
        response = authenticated_admin.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_teacher_denied(self, authenticated_teacher):
        """Permission: Teacher cannot access form master dashboard"""
        response = authenticated_teacher.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_empty_dataset(self, authenticated_form_master):
        """Edge case: Empty dataset returns valid structure"""
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['statistics']['total_cases'] == 0
    
    def test_with_pending_cases(self, authenticated_form_master, form_master_user, student):
        """Branch: With pending intervention cases"""
        from interventions.models import InterventionCase
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['pending_cases']) >= 1
    
    def test_with_urgent_alerts(self, authenticated_form_master, form_master_user, student, subject):
        """Branch: With urgent alerts"""
        from alerts.models import Alert
        Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['urgent_alerts']) >= 1
