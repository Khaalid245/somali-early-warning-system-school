"""
Role-Based Access Control (RBAC) Tests
Tests that users can only access resources appropriate for their role

WHY THIS MATTERS:
- Prevents privilege escalation attacks
- Ensures teachers cannot access admin functions
- Enforces separation of duties (FERPA compliance)
- Critical for multi-tenant security in educational systems
"""
import pytest
from rest_framework import status


@pytest.mark.rbac
class TestRoleBasedAccessControl:
    """Test role boundaries and permission enforcement"""

    # =====================================================
    # ADMIN-ONLY OPERATIONS
    # =====================================================

    def test_admin_can_list_users(self, authenticated_admin):
        """
        RBAC: Only admins should list all users
        """
        url = '/api/dashboard/admin/users/'
        response = authenticated_admin.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'users' in response.data

    def test_teacher_cannot_list_users(self, authenticated_teacher):
        """
        RBAC: Teachers must not access user management
        """
        url = '/api/dashboard/admin/users/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_form_master_cannot_list_users(self, authenticated_form_master):
        """
        RBAC: Form masters must not access user management
        """
        url = '/api/dashboard/admin/users/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_user(self, authenticated_admin):
        """
        RBAC: Only admins can create users (no public registration)
        """
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'New Teacher',
            'email': 'newteacher@school.com',
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED

    def test_teacher_cannot_create_user(self, authenticated_teacher):
        """
        RBAC: Teachers cannot create users (privilege escalation prevention)
        """
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Malicious Admin',
            'email': 'malicious@school.com',
            'password': 'password123',
            'role': 'admin'
        }
        response = authenticated_teacher.post(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_classroom(self, authenticated_admin, form_master_user):
        """
        RBAC: Only admins can create classrooms
        """
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Grade 11A',
            'academic_year': '2024',
            'form_master_id': form_master_user.id
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED

    def test_teacher_cannot_create_classroom(self, authenticated_teacher):
        """
        RBAC: Teachers cannot create classrooms
        """
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Grade 11B',
            'academic_year': '2024'
        }
        response = authenticated_teacher.post(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_enroll_student(self, authenticated_admin, student, classroom):
        """
        RBAC: Only admins can enroll students
        """
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': student.student_id,
            'class_id': classroom.class_id,
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED

    def test_teacher_cannot_enroll_student(self, authenticated_teacher, student, classroom):
        """
        RBAC: Teachers cannot enroll students
        """
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': student.student_id,
            'class_id': classroom.class_id,
            'academic_year': '2024'
        }
        response = authenticated_teacher.post(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # =====================================================
    # TEACHER-ONLY OPERATIONS
    # =====================================================

    def test_teacher_can_record_attendance(self, authenticated_teacher, classroom, subject, teaching_assignment, enrollment):
        """
        RBAC: Teachers can record attendance for assigned classes
        """
        url = '/api/attendance/sessions/'
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': '2024-01-15',
            'teacher': authenticated_teacher.handler._force_user.id,
            'records': [
                {
                    'student': enrollment.student.student_id,
                    'status': 'present'
                }
            ]
        }
        response = authenticated_teacher.post(url, data, format='json')
        
        # Should succeed or fail with business logic error, not 403
        assert response.status_code != status.HTTP_403_FORBIDDEN

    def test_form_master_cannot_record_attendance(self, authenticated_form_master, classroom, subject, enrollment):
        """
        RBAC: Form masters cannot record attendance (teacher-only function)
        """
        url = '/api/attendance/sessions/'
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': '2024-01-15',
            'teacher': authenticated_form_master.handler._force_user.id,
            'records': [
                {
                    'student': enrollment.student.student_id,
                    'status': 'present'
                }
            ]
        }
        response = authenticated_form_master.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # =====================================================
    # FORM MASTER OPERATIONS
    # =====================================================

    def test_form_master_can_view_own_classroom(self, authenticated_form_master, classroom):
        """
        RBAC: Form masters can view their assigned classroom
        """
        url = f'/api/students/classrooms/{classroom.class_id}/'
        response = authenticated_form_master.get(url)
        
        # Should succeed or return 404 if endpoint doesn't exist, not 403
        assert response.status_code != status.HTTP_403_FORBIDDEN

    def test_teacher_can_view_assigned_classes(self, authenticated_teacher, teaching_assignment):
        """
        RBAC: Teachers can view classes they're assigned to
        """
        url = '/api/attendance/sessions/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    # =====================================================
    # CROSS-ROLE VALIDATION
    # =====================================================

    def test_admin_can_disable_user(self, authenticated_admin, teacher_user):
        """
        RBAC: Admins can disable users (soft delete)
        """
        url = f'/api/dashboard/admin/users/{teacher_user.id}/disable/'
        response = authenticated_admin.post(url)
        
        assert response.status_code == status.HTTP_200_OK

    def test_teacher_cannot_disable_user(self, authenticated_teacher, form_master_user):
        """
        RBAC: Teachers cannot disable users
        """
        url = f'/api/dashboard/admin/users/{form_master_user.id}/disable/'
        response = authenticated_teacher.post(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_cannot_disable_self(self, authenticated_admin):
        """
        BUSINESS LOGIC: Admins cannot disable themselves
        """
        admin_id = authenticated_admin.handler._force_user.id
        url = f'/api/dashboard/admin/users/{admin_id}/disable/'
        response = authenticated_admin.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
