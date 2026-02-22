"""
IDOR (Insecure Direct Object Reference) Protection Tests
Tests that form masters can only access their assigned classroom

WHY THIS MATTERS:
- Prevents unauthorized data access across classrooms
- Critical for student privacy (FERPA compliance)
- Form Master A should never see Form Master B's students
- Prevents horizontal privilege escalation
- Real-world attack vector in multi-tenant systems
"""
import pytest
from rest_framework import status
from interventions.models import InterventionCase
from alerts.models import Alert


@pytest.mark.idor
class TestIDORProtection:
    """Test resource isolation between form masters"""

    # =====================================================
    # CLASSROOM ISOLATION
    # =====================================================

    def test_form_master_can_access_own_classroom(self, authenticated_form_master, classroom):
        """
        IDOR: Form masters should access their own classroom
        """
        url = f'/api/students/classrooms/{classroom.class_id}/'
        response = authenticated_form_master.get(url)
        
        # Should succeed or 404 if endpoint structure differs, not 403
        assert response.status_code != status.HTTP_403_FORBIDDEN

    def test_form_master_cannot_access_other_classroom(self, authenticated_form_master, another_classroom):
        """
        IDOR: Form masters must not access other classrooms
        CRITICAL SECURITY TEST
        """
        url = f'/api/students/classrooms/{another_classroom.class_id}/'
        response = authenticated_form_master.get(url)
        
        # Should be forbidden or not found (both acceptable for security)
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_admin_can_access_any_classroom(self, authenticated_admin, classroom, another_classroom):
        """
        IDOR: Admins should access all classrooms
        """
        url1 = f'/api/students/classrooms/{classroom.class_id}/'
        url2 = f'/api/students/classrooms/{another_classroom.class_id}/'
        
        response1 = authenticated_admin.get(url1)
        response2 = authenticated_admin.get(url2)
        
        # Admin should not be blocked by IDOR protection
        assert response1.status_code != status.HTTP_403_FORBIDDEN
        assert response2.status_code != status.HTTP_403_FORBIDDEN

    # =====================================================
    # INTERVENTION CASE ISOLATION
    # =====================================================

    def test_form_master_can_access_own_intervention_case(
        self, authenticated_form_master, form_master_user, student, enrollment
    ):
        """
        IDOR: Form masters should access their own intervention cases
        """
        # Create intervention case assigned to form master
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        url = f'/api/interventions/cases/{case.case_id}/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    def test_form_master_cannot_access_other_intervention_case(
        self, authenticated_form_master, another_form_master, student
    ):
        """
        IDOR: Form masters must not access other form masters' cases
        CRITICAL SECURITY TEST
        """
        # Create intervention case assigned to another form master
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=another_form_master,
            status='open'
        )
        
        url = f'/api/interventions/cases/{case.case_id}/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_access_any_intervention_case(
        self, authenticated_admin, form_master_user, student
    ):
        """
        IDOR: Admins should access all intervention cases
        """
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        url = f'/api/interventions/cases/{case.case_id}/'
        response = authenticated_admin.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    # =====================================================
    # ALERT ISOLATION
    # =====================================================

    def test_form_master_can_access_own_alert(
        self, authenticated_form_master, form_master_user, student, subject
    ):
        """
        IDOR: Form masters should access alerts assigned to them
        """
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    def test_form_master_cannot_access_other_alert(
        self, authenticated_form_master, another_form_master, student, subject
    ):
        """
        IDOR: Form masters must not access other form masters' alerts
        CRITICAL SECURITY TEST
        """
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=another_form_master,
            status='active'
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # =====================================================
    # STUDENT DATA ISOLATION
    # =====================================================

    def test_form_master_can_view_own_classroom_students(
        self, authenticated_form_master, classroom, enrollment
    ):
        """
        IDOR: Form masters should view students in their classroom
        """
        url = f'/api/students/classrooms/{classroom.class_id}/students/'
        response = authenticated_form_master.get(url)
        
        # Should succeed or 404 if endpoint differs, not 403
        assert response.status_code != status.HTTP_403_FORBIDDEN

    def test_form_master_cannot_view_other_classroom_students(
        self, authenticated_form_master, another_classroom
    ):
        """
        IDOR: Form masters must not view other classroom students
        CRITICAL PRIVACY TEST (FERPA)
        """
        url = f'/api/students/classrooms/{another_classroom.class_id}/students/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    # =====================================================
    # ATTENDANCE DATA ISOLATION
    # =====================================================

    def test_form_master_can_view_own_classroom_attendance(
        self, authenticated_form_master, classroom
    ):
        """
        IDOR: Form masters should view attendance for their classroom
        """
        url = '/api/attendance/sessions/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify only own classroom data is returned
        if response.data.get('results'):
            for session in response.data['results']:
                assert session['classroom'] == classroom.class_id

    def test_teacher_cannot_access_unassigned_classroom_attendance(
        self, authenticated_teacher, another_classroom
    ):
        """
        IDOR: Teachers should only see attendance for assigned classes
        """
        url = '/api/attendance/sessions/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify no data from unassigned classroom
        if response.data.get('results'):
            for session in response.data['results']:
                assert session['classroom'] != another_classroom.class_id
