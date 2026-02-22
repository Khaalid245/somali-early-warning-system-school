"""
Test Coverage for interventions/views.py
Target: Increase coverage from 32% to 80%+
Focus: Uncovered lines and branches
"""
import pytest
from rest_framework import status
from interventions.models import InterventionCase
from alerts.models import Alert


@pytest.mark.django_db
class TestInterventionCaseListCreateView:
    """Cover InterventionCaseListCreateView branches"""
    
    def test_admin_sees_all_cases(self, authenticated_admin, student, form_master_user):
        """Branch: user.role == 'admin' in get_queryset"""
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_admin.get('/api/interventions/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_form_master_sees_only_assigned_cases(self, authenticated_form_master, student, form_master_user, other_form_master_user):
        """Branch: user.role == 'form_master' in get_queryset"""
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        InterventionCase.objects.create(
            student=student,
            assigned_to=other_form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.get('/api/interventions/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
    
    def test_teacher_sees_no_cases(self, authenticated_teacher):
        """Branch: return InterventionCase.objects.none()"""
        response = authenticated_teacher.get('/api/interventions/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
    
    def test_teacher_cannot_create_case(self, authenticated_teacher, student):
        """Branch: user.role not in ['admin', 'form_master'] in perform_create"""
        data = {'student': student.student_id, 'status': 'open'}
        response = authenticated_teacher.post('/api/interventions/', data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_case_without_student_fails(self, authenticated_form_master):
        """Branch: if not student in perform_create"""
        data = {'status': 'open'}
        response = authenticated_form_master.post('/api/interventions/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_form_master_auto_assigned_on_create(self, authenticated_form_master, student, form_master_user):
        """Branch: if user.role == 'form_master' in perform_create"""
        data = {'student': student.student_id, 'status': 'open'}
        response = authenticated_form_master.post('/api/interventions/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['assigned_to'] == form_master_user.id
    
    def test_admin_can_assign_to_others(self, authenticated_admin, student, form_master_user):
        """Branch: else in perform_create (admin assigns)"""
        data = {
            'student': student.student_id,
            'assigned_to': form_master_user.id,
            'status': 'open'
        }
        response = authenticated_admin.post('/api/interventions/', data)
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
class TestInterventionCaseDetailView:
    """Cover InterventionCaseDetailView branches"""
    
    def test_admin_sees_all_cases_detail(self, authenticated_admin, student, form_master_user):
        """Branch: user.role == 'admin' in get_queryset"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_admin.get(f'/api/interventions/cases/{case.case_id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_form_master_sees_only_assigned_detail(self, authenticated_form_master, student, form_master_user):
        """Branch: user.role == 'form_master' in get_queryset"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.get(f'/api/interventions/cases/{case.case_id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_form_master_cannot_see_others_case(self, authenticated_form_master, student, other_form_master_user):
        """Branch: IDOR protection"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=other_form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.get(f'/api/interventions/cases/{case.case_id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_teacher_cannot_see_cases(self, authenticated_teacher, student, form_master_user):
        """Branch: return InterventionCase.objects.none() in get_queryset"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_teacher.get(f'/api/interventions/cases/{case.case_id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_cannot_update_others_case(self, authenticated_form_master, student, other_form_master_user):
        """Branch: if user.role == 'form_master' and case.assigned_to != user"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=other_form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.patch(
            f'/api/interventions/cases/{case.case_id}/',
            {'status': 'in_progress'}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_teacher_cannot_update_case(self, authenticated_teacher, student, form_master_user):
        """Branch: if user.role not in ['admin', 'form_master'] in perform_update"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_teacher.patch(
            f'/api/interventions/cases/{case.case_id}/',
            {'status': 'in_progress'}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_close_case_without_resolution_notes_fails(self, authenticated_form_master, student, form_master_user):
        """Branch: if new_status == 'closed' and not resolution_notes"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.patch(
            f'/api/interventions/cases/{case.case_id}/',
            {'status': 'closed'}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'resolution notes' in response.data['error'].lower()
    
    def test_invalid_version_ignored(self, authenticated_form_master, student, form_master_user):
        """Branch: except (ValueError, TypeError) in version check"""
        case = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.patch(
            f'/api/interventions/cases/{case.case_id}/',
            {'status': 'in_progress', 'version': 'invalid'}
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_auto_resolve_alert_when_all_cases_closed(self, authenticated_form_master, student, form_master_user, subject):
        """Branch: Auto resolve alert when all cases closed"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        case = InterventionCase.objects.create(
            student=student,
            alert=alert,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.patch(
            f'/api/interventions/cases/{case.case_id}/',
            {'status': 'closed', 'resolution_notes': 'Issue resolved'}
        )
        assert response.status_code == status.HTTP_200_OK
        
        alert.refresh_from_db()
        assert alert.status == 'resolved'
    
    def test_alert_not_resolved_if_open_cases_exist(self, authenticated_form_master, student, form_master_user, subject):
        """Branch: if not open_cases_exist check"""
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        case1 = InterventionCase.objects.create(
            student=student,
            alert=alert,
            assigned_to=form_master_user,
            status='open'
        )
        case2 = InterventionCase.objects.create(
            student=student,
            alert=alert,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.patch(
            f'/api/interventions/cases/{case1.case_id}/',
            {'status': 'closed', 'resolution_notes': 'Partial resolution'}
        )
        assert response.status_code == status.HTTP_200_OK
        
        alert.refresh_from_db()
        assert alert.status == 'active'