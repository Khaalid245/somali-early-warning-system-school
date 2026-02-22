"""
Test Coverage for students/views/student_history.py
Target: Increase coverage from 50% to 85%+
"""
import pytest
from students.models import StudentEnrollment


@pytest.mark.django_db
class TestStudentHistoryView:
    """API integration tests for StudentHistoryView"""
    
    def test_invalid_student_id_returns_404(self, authenticated_admin):
        """Branch: except Student.DoesNotExist"""
        response = authenticated_admin.get('/api/students/99999/history/')
        assert response.status_code == 404
        assert response.data['error'] == 'Student not found'
    
    def test_admin_access_student_no_enrollment_history(self, authenticated_admin, student):
        """Admin accessing student with NO enrollment history - should return 200 with empty history"""
        response = authenticated_admin.get(f'/api/students/{student.student_id}/history/')
        assert response.status_code == 200
        assert 'student_info' in response.data
        assert response.data['student_info']['student_id'] == student.student_id
        assert response.data['student_info']['full_name'] == student.full_name
        assert response.data['attendance_summary']['total_sessions'] == 0
        assert response.data['alert_history'] == []
        assert response.data['intervention_history'] == []
    
    def test_admin_access_student_multiple_enrollment_records(self, authenticated_admin, student, classroom, another_classroom):
        """Admin accessing student with MULTIPLE enrollment records - should return 200"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year="2023",
            is_active=False
        )
        StudentEnrollment.objects.create(
            student=student,
            classroom=another_classroom,
            academic_year="2024",
            is_active=True
        )
        
        response = authenticated_admin.get(f'/api/students/{student.student_id}/history/')
        assert response.status_code == 200
        assert 'student_info' in response.data
        assert response.data['student_info']['student_id'] == student.student_id
    
    def test_teacher_access_student_in_their_classroom(self, authenticated_teacher, student, classroom, teacher_user, subject):
        """Teacher accessing student in classroom they teach - should return 200"""
        from academics.models import TeachingAssignment
        
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year="2024",
            is_active=True
        )
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject,
            is_active=True
        )
        
        response = authenticated_teacher.get(f'/api/students/{student.student_id}/history/')
        assert response.status_code == 200
        assert 'student_info' in response.data
    
    def test_teacher_access_student_not_in_their_classroom(self, authenticated_teacher, student, another_classroom, another_form_master):
        """Teacher accessing student NOT in their classroom - returns 200 (no RBAC implemented)"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=another_classroom,
            academic_year="2024",
            is_active=True
        )
        
        response = authenticated_teacher.get(f'/api/students/{student.student_id}/history/')
        # View has NO RBAC - only IsAuthenticated permission
        assert response.status_code == 200
    
    def test_form_master_access_student_outside_their_classroom(self, authenticated_form_master, student, another_classroom, another_form_master):
        """Form master accessing student outside their classroom - returns 200 (no RBAC implemented)"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=another_classroom,
            academic_year="2024",
            is_active=True
        )
        
        response = authenticated_form_master.get(f'/api/students/{student.student_id}/history/')
        # View has NO RBAC - only IsAuthenticated permission
        assert response.status_code == 200
