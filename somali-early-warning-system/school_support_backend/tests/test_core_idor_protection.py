"""
Test Coverage for core/idor_protection.py
Targets: IDORProtectionMixin.get_object() enforcement
Coverage Goal: 100% branch coverage
"""
import pytest
from rest_framework.exceptions import PermissionDenied
from interventions.models import InterventionCase
from alerts.models import Alert


@pytest.mark.idor
class TestIDORProtectionMixinInterventionCase:
    """Test IDOR protection for InterventionCase model"""
    
    def test_form_master_blocked_from_other_intervention(self, api_client, form_master_user, other_form_master_user, classroom):
        """Branch: isinstance(obj, InterventionCase) and obj.assigned_to != user"""
        
        # Create intervention assigned to other form master
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST001',
            full_name='Test Student',
            gender='male'
        )
        
        intervention = InterventionCase.objects.create(
            student=student,
            assigned_to=other_form_master_user,  # Different form master
            status='open'
        )
        
        url = f'/api/interventions/cases/{intervention.case_id}/'
        api_client.force_authenticate(user=form_master_user)
        
        response = api_client.get(url)
        assert response.status_code == 403
        assert "don't have permission" in str(response.data)
    
    def test_form_master_accesses_own_intervention(self, api_client, form_master_user, classroom):
        """Branch: isinstance(obj, InterventionCase) and obj.assigned_to == user"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST002',
            full_name='Test Student',
            gender='male'
        )
        
        intervention = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,  # Same form master
            status='open'
        )
        
        url = f'/api/interventions/cases/{intervention.case_id}/'
        api_client.force_authenticate(user=form_master_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['case_id'] == intervention.case_id
    
    def test_admin_accesses_any_intervention(self, api_client, admin_user, form_master_user):
        """Branch: user.role == 'admin' bypass for InterventionCase"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST003',
            full_name='Test Student',
            gender='male'
        )
        
        intervention = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,  # Owned by form master
            status='open'
        )
        
        url = f'/api/interventions/cases/{intervention.case_id}/'
        api_client.force_authenticate(user=admin_user)  # Admin accessing
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['case_id'] == intervention.case_id


@pytest.mark.idor
class TestIDORProtectionMixinAlert:
    """Test IDOR protection for Alert model"""
    
    def test_teacher_blocked_from_other_alert(self, api_client, teacher_user, other_teacher_user, classroom):
        """Branch: isinstance(obj, Alert) and obj.assigned_to != user"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST004',
            full_name='Test Student',
            gender='male'
        )
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='high',
            assigned_to=other_teacher_user  # Different teacher
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        api_client.force_authenticate(user=teacher_user)
        
        response = api_client.get(url)
        assert response.status_code == 403
        assert "don't have permission" in str(response.data)
    
    def test_teacher_accesses_own_alert(self, api_client, teacher_user, classroom):
        """Branch: isinstance(obj, Alert) and obj.assigned_to == user"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST005',
            full_name='Test Student',
            gender='male'
        )
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='high',
            assigned_to=teacher_user  # Same teacher
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        api_client.force_authenticate(user=teacher_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['alert_id'] == alert.alert_id
    
    def test_admin_accesses_any_alert(self, api_client, admin_user, teacher_user, classroom):
        """Branch: user.role == 'admin' bypass for Alert"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST006',
            full_name='Test Student',
            gender='male'
        )
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='high',
            assigned_to=teacher_user  # Owned by teacher
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        api_client.force_authenticate(user=admin_user)  # Admin accessing
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['alert_id'] == alert.alert_id
    
    def test_form_master_blocked_from_teacher_alert(self, api_client, form_master_user, teacher_user, classroom):
        """Branch: Non-admin, non-owner accessing Alert"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST007',
            full_name='Test Student',
            gender='male'
        )
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='high',
            assigned_to=teacher_user  # Owned by teacher
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        api_client.force_authenticate(user=form_master_user)  # Form master trying to access
        
        response = api_client.get(url)
        assert response.status_code == 403


@pytest.mark.idor
class TestIDORProtectionMixinEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_unauthenticated_user_blocked(self, api_client, teacher_user, classroom):
        """Unauthenticated access should fail before IDOR check"""
        
        from students.models import Student
        student = Student.objects.create(
            admission_number='TEST008',
            full_name='Test Student',
            gender='male'
        )
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='high',
            assigned_to=teacher_user
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        # No authentication
        
        response = api_client.get(url)
        assert response.status_code == 401
    
    def test_nonexistent_resource_returns_404(self, api_client, teacher_user):
        """Non-existent resource should return 404 before IDOR check"""
        
        url = '/api/alerts/99999/'
        api_client.force_authenticate(user=teacher_user)
        
        response = api_client.get(url)
        assert response.status_code == 404
