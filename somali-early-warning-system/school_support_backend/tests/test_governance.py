"""
Governance Layer Tests
Tests admin-only operations: user management, classroom management, enrollments

WHY THIS MATTERS:
- Governance is the control plane of the system
- Only admins should provision users (no public registration)
- Prevents unauthorized system configuration changes
- Ensures data integrity (no duplicate enrollments, form master conflicts)
- Critical for FERPA compliance (centralized access control)
"""
import pytest
from rest_framework import status
from users.models import User
from students.models import Classroom, StudentEnrollment
from academics.models import TeachingAssignment


@pytest.mark.governance
class TestGovernanceLayer:
    """Test admin governance operations"""

    # =====================================================
    # USER MANAGEMENT
    # =====================================================

    def test_admin_can_create_teacher(self, authenticated_admin):
        """
        GOVERNANCE: Admin can create teacher accounts
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
        assert User.objects.filter(email='newteacher@school.com').exists()

    def test_admin_can_create_form_master(self, authenticated_admin):
        """
        GOVERNANCE: Admin can create form master accounts
        """
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'New Form Master',
            'email': 'newformmaster@school.com',
            'password': 'password123',
            'role': 'form_master'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newformmaster@school.com', role='form_master').exists()

    def test_admin_can_create_admin(self, authenticated_admin):
        """
        GOVERNANCE: Admin can create other admin accounts
        """
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'New Admin',
            'email': 'newadmin@school.com',
            'password': 'password123',
            'role': 'admin'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newadmin@school.com', role='admin').exists()

    def test_cannot_create_user_with_duplicate_email(self, authenticated_admin, teacher_user):
        """
        DATA INTEGRITY: Duplicate emails must be rejected
        """
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Duplicate User',
            'email': teacher_user.email,
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_create_user_with_invalid_role(self, authenticated_admin):
        """
        DATA INTEGRITY: Invalid roles must be rejected
        """
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Invalid Role User',
            'email': 'invalid@school.com',
            'password': 'password123',
            'role': 'superuser'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_can_update_user(self, authenticated_admin, teacher_user):
        """
        GOVERNANCE: Admin can update user details
        """
        url = f'/api/dashboard/admin/users/{teacher_user.id}/'
        data = {
            'name': 'Updated Teacher Name',
            'email': 'updatedteacher@school.com'
        }
        response = authenticated_admin.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        teacher_user.refresh_from_db()
        assert teacher_user.name == 'Updated Teacher Name'

    def test_admin_can_disable_user(self, authenticated_admin, teacher_user):
        """
        GOVERNANCE: Admin can disable users (soft delete)
        """
        url = f'/api/dashboard/admin/users/{teacher_user.id}/disable/'
        response = authenticated_admin.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        teacher_user.refresh_from_db()
        assert teacher_user.is_active is False

    def test_admin_can_enable_user(self, authenticated_admin, teacher_user):
        """
        GOVERNANCE: Admin can re-enable disabled users
        """
        teacher_user.is_active = False
        teacher_user.save()
        
        url = f'/api/dashboard/admin/users/{teacher_user.id}/enable/'
        response = authenticated_admin.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        teacher_user.refresh_from_db()
        assert teacher_user.is_active is True

    # =====================================================
    # CLASSROOM MANAGEMENT
    # =====================================================

    def test_admin_can_create_classroom(self, authenticated_admin, form_master_user):
        """
        GOVERNANCE: Admin can create classrooms
        """
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Grade 11A',
            'academic_year': '2024',
            'form_master_id': form_master_user.id
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Classroom.objects.filter(name='Grade 11A', academic_year='2024').exists()

    def test_admin_can_create_classroom_without_form_master(self, authenticated_admin):
        """
        GOVERNANCE: Classrooms can be created without form master
        """
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Grade 11B',
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED

    def test_cannot_assign_form_master_to_multiple_classrooms(
        self, authenticated_admin, form_master_user, classroom
    ):
        """
        DATA INTEGRITY: Form master can only be assigned to one classroom
        """
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Grade 11C',
            'academic_year': '2024',
            'form_master_id': form_master_user.id
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_can_update_classroom(self, authenticated_admin, classroom, another_form_master):
        """
        GOVERNANCE: Admin can update classroom details
        """
        url = f'/api/dashboard/admin/classrooms/{classroom.class_id}/'
        data = {
            'name': 'Grade 10A Updated',
            'form_master_id': another_form_master.id
        }
        response = authenticated_admin.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        classroom.refresh_from_db()
        assert classroom.name == 'Grade 10A Updated'

    # =====================================================
    # STUDENT ENROLLMENT
    # =====================================================

    def test_admin_can_enroll_student(self, authenticated_admin, student, classroom):
        """
        GOVERNANCE: Admin can enroll students in classrooms
        """
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': student.student_id,
            'class_id': classroom.class_id,
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert StudentEnrollment.objects.filter(
            student=student,
            classroom=classroom,
            academic_year='2024'
        ).exists()

    def test_cannot_enroll_student_twice_same_year(
        self, authenticated_admin, student, classroom, enrollment
    ):
        """
        DATA INTEGRITY: Student cannot be enrolled twice in same academic year
        """
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': student.student_id,
            'class_id': classroom.class_id,
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_can_list_enrollments(self, authenticated_admin, enrollment):
        """
        GOVERNANCE: Admin can view all enrollments
        """
        url = '/api/dashboard/admin/enrollments/'
        response = authenticated_admin.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'enrollments' in response.data

    # =====================================================
    # TEACHER ASSIGNMENT
    # =====================================================

    def test_admin_can_assign_teacher_to_class(
        self, authenticated_admin, teacher_user, classroom, subject
    ):
        """
        GOVERNANCE: Admin can assign teachers to classes
        """
        url = '/api/dashboard/admin/assignments/create/'
        data = {
            'teacher_id': teacher_user.id,
            'class_id': classroom.class_id,
            'subject_id': subject.subject_id
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert TeachingAssignment.objects.filter(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        ).exists()

    def test_cannot_assign_teacher_duplicate(
        self, authenticated_admin, teacher_user, classroom, subject, teaching_assignment
    ):
        """
        DATA INTEGRITY: Cannot create duplicate teaching assignments
        """
        url = '/api/dashboard/admin/assignments/create/'
        data = {
            'teacher_id': teacher_user.id,
            'class_id': classroom.class_id,
            'subject_id': subject.subject_id
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_can_list_assignments(self, authenticated_admin, teaching_assignment):
        """
        GOVERNANCE: Admin can view all teaching assignments
        """
        url = '/api/dashboard/admin/assignments/'
        response = authenticated_admin.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'assignments' in response.data

    # =====================================================
    # AUDIT LOGGING
    # =====================================================

    def test_user_creation_is_logged(self, authenticated_admin, db):
        """
        COMPLIANCE: User creation should be logged for audit
        """
        from dashboard.models import AuditLog
        
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Audit Test User',
            'email': 'audituser@school.com',
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert AuditLog.objects.filter(action='user_created').exists()

    def test_classroom_creation_is_logged(self, authenticated_admin, db):
        """
        COMPLIANCE: Classroom creation should be logged for audit
        """
        from dashboard.models import AuditLog
        
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Audit Test Class',
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert AuditLog.objects.filter(action='classroom_created').exists()
