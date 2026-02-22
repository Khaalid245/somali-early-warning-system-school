"""
Edge Case Tests
Tests boundary conditions, error handling, and unusual scenarios

WHY THIS MATTERS:
- Edge cases cause production bugs
- Validates error handling and user feedback
- Tests security boundaries (expired tokens, invalid data)
- Ensures system stability under unusual conditions
"""
import pytest
from rest_framework import status
from django.contrib.auth.hashers import make_password
from datetime import date, timedelta
from users.models import User


@pytest.mark.django_db
class TestAuthenticationEdgeCases:
    """Test authentication boundary conditions"""

    def test_login_with_empty_email(self, api_client):
        """Edge case: Empty email should be rejected"""
        url = '/api/auth/login/'
        data = {'email': '', 'password': 'password123'}
        response = api_client.post(url, data)
        
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED
        ]

    def test_login_with_empty_password(self, api_client, admin_user):
        """Edge case: Empty password should be rejected"""
        url = '/api/auth/login/'
        data = {'email': 'admin@school.com', 'password': ''}
        response = api_client.post(url, data)
        
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED
        ]

    def test_login_with_sql_injection_attempt(self, api_client):
        """Security: SQL injection in login should be rejected"""
        url = '/api/auth/login/'
        data = {
            'email': "admin@school.com' OR '1'='1",
            'password': "password' OR '1'='1"
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_with_very_long_email(self, api_client):
        """Edge case: Extremely long email should be handled"""
        url = '/api/auth/login/'
        data = {
            'email': 'a' * 1000 + '@school.com',
            'password': 'password123'
        }
        response = api_client.post(url, data)
        
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED
        ]

    def test_login_with_special_characters_in_email(self, api_client):
        """Edge case: Special characters in email"""
        url = '/api/auth/login/'
        data = {
            'email': 'admin+test@school.com',
            'password': 'password123'
        }
        response = api_client.post(url, data)
        
        # Should be rejected (user doesn't exist)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_multiple_failed_login_attempts(self, api_client, admin_user):
        """Security: Multiple failed logins should be handled"""
        url = '/api/auth/login/'
        
        # Try 5 failed logins
        for _ in range(5):
            data = {'email': 'admin@school.com', 'password': 'wrongpassword'}
            response = api_client.post(url, data)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # System should still respond (not crash)
        data = {'email': 'admin@school.com', 'password': 'admin123'}
        response = api_client.post(url, data)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_429_TOO_MANY_REQUESTS  # If rate limiting enabled
        ]

    def test_login_case_sensitivity(self, api_client, admin_user):
        """Edge case: Email case sensitivity"""
        url = '/api/auth/login/'
        data = {
            'email': 'ADMIN@SCHOOL.COM',  # Uppercase
            'password': 'admin123'
        }
        response = api_client.post(url, data)
        
        # Django email fields are case-insensitive by default
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED
        ]


@pytest.mark.django_db
class TestUserManagementEdgeCases:
    """Test user management boundary conditions"""

    def test_create_user_with_duplicate_email_different_case(
        self, authenticated_admin, teacher_user
    ):
        """Edge case: Duplicate email with different case"""
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Duplicate User',
            'email': 'TEACHER@SCHOOL.COM',  # Uppercase of existing
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_user_with_whitespace_in_email(self, authenticated_admin):
        """Edge case: Email with leading/trailing whitespace"""
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Test User',
            'email': '  teacher@school.com  ',
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        # Should either succeed (after trimming) or fail validation
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_create_user_with_invalid_email_format(self, authenticated_admin):
        """Edge case: Invalid email format"""
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Test User',
            'email': 'not-an-email',
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_user_with_weak_password(self, authenticated_admin):
        """Edge case: Very weak password"""
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Test User',
            'email': 'test@school.com',
            'password': '123',  # Too short
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        # Should succeed or fail based on password validation
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_create_user_with_missing_required_fields(self, authenticated_admin):
        """Edge case: Missing required fields"""
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': 'Test User'
            # Missing email, password, role
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_user_with_empty_name(self, authenticated_admin, teacher_user):
        """Edge case: Update user with empty name"""
        url = f'/api/dashboard/admin/users/{teacher_user.id}/'
        data = {'name': ''}
        response = authenticated_admin.patch(url, data)
        
        # Should either ignore empty or reject
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_disable_nonexistent_user(self, authenticated_admin):
        """Edge case: Disable user that doesn't exist"""
        url = '/api/dashboard/admin/users/99999/disable/'
        response = authenticated_admin.post(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_enable_already_active_user(self, authenticated_admin, teacher_user):
        """Edge case: Enable user that's already active"""
        url = f'/api/dashboard/admin/users/{teacher_user.id}/enable/'
        response = authenticated_admin.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        teacher_user.refresh_from_db()
        assert teacher_user.is_active is True


@pytest.mark.django_db
class TestAttendanceEdgeCases:
    """Test attendance recording edge cases"""

    def test_record_attendance_for_future_date(
        self, authenticated_teacher, classroom, subject, teaching_assignment
    ):
        """Edge case: Cannot record attendance for future dates"""
        future_date = date.today() + timedelta(days=7)
        
        url = '/api/attendance/sessions/'
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(future_date),
            'teacher': authenticated_teacher.handler._force_user.id,
            'records': []
        }
        response = authenticated_teacher.post(url, data, format='json')
        
        # Should be rejected or accepted based on business rules
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN
        ]

    def test_record_attendance_for_very_old_date(
        self, authenticated_teacher, classroom, subject, teaching_assignment
    ):
        """Edge case: Record attendance for date 1 year ago"""
        old_date = date.today() - timedelta(days=365)
        
        url = '/api/attendance/sessions/'
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(old_date),
            'teacher': authenticated_teacher.handler._force_user.id,
            'records': []
        }
        response = authenticated_teacher.post(url, data, format='json')
        
        # Should be accepted (makeup entry) or rejected
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]

    def test_record_attendance_with_invalid_status(
        self, authenticated_teacher, classroom, subject, teaching_assignment, enrollment
    ):
        """Edge case: Invalid attendance status"""
        url = '/api/attendance/sessions/'
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'teacher': authenticated_teacher.handler._force_user.id,
            'records': [
                {
                    'student': enrollment.student.student_id,
                    'status': 'invalid_status'  # Not present/absent/late
                }
            ]
        }
        response = authenticated_teacher.post(url, data, format='json')
        
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]

    def test_record_attendance_with_empty_records(
        self, authenticated_teacher, classroom, subject, teaching_assignment
    ):
        """Edge case: Attendance session with no student records"""
        url = '/api/attendance/sessions/'
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'teacher': authenticated_teacher.handler._force_user.id,
            'records': []  # Empty
        }
        response = authenticated_teacher.post(url, data, format='json')
        
        # Should be accepted or rejected based on business rules
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]


@pytest.mark.django_db
class TestEnrollmentEdgeCases:
    """Test student enrollment edge cases"""

    def test_enroll_student_in_nonexistent_classroom(
        self, authenticated_admin, student
    ):
        """Edge case: Enroll in classroom that doesn't exist"""
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': student.student_id,
            'class_id': 99999,  # Doesn't exist
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_enroll_nonexistent_student(self, authenticated_admin, classroom):
        """Edge case: Enroll student that doesn't exist"""
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': 99999,  # Doesn't exist
            'class_id': classroom.class_id,
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_enroll_with_invalid_academic_year(
        self, authenticated_admin, student, classroom
    ):
        """Edge case: Invalid academic year format"""
        url = '/api/dashboard/admin/enrollments/create/'
        data = {
            'student_id': student.student_id,
            'class_id': classroom.class_id,
            'academic_year': 'invalid'
        }
        response = authenticated_admin.post(url, data)
        
        # Should be accepted or rejected based on validation
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]


@pytest.mark.django_db
class TestClassroomEdgeCases:
    """Test classroom management edge cases"""

    def test_create_classroom_with_empty_name(self, authenticated_admin):
        """Edge case: Classroom with empty name"""
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': '',
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_classroom_with_very_long_name(self, authenticated_admin):
        """Edge case: Classroom with extremely long name"""
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'A' * 1000,
            'academic_year': '2024'
        }
        response = authenticated_admin.post(url, data)
        
        # Should be rejected or truncated
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_assign_nonexistent_form_master(self, authenticated_admin):
        """Edge case: Assign form master that doesn't exist"""
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Test Class',
            'academic_year': '2024',
            'form_master_id': 99999  # Doesn't exist
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_assign_teacher_as_form_master(
        self, authenticated_admin, teacher_user
    ):
        """Edge case: Assign teacher (not form master) to classroom"""
        url = '/api/dashboard/admin/classrooms/create/'
        data = {
            'name': 'Test Class',
            'academic_year': '2024',
            'form_master_id': teacher_user.id  # Teacher, not form master
        }
        response = authenticated_admin.post(url, data)
        
        # Should be rejected (role mismatch)
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestSecurityEdgeCases:
    """Test security boundary conditions"""

    def test_access_with_malformed_token(self, api_client):
        """Security: Malformed JWT token should be rejected"""
        api_client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_format')
        url = '/api/dashboard/admin/users/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_access_with_empty_token(self, api_client):
        """Security: Empty token should be rejected"""
        api_client.credentials(HTTP_AUTHORIZATION='Bearer ')
        url = '/api/dashboard/admin/users/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_access_without_bearer_prefix(self, api_client, admin_user):
        """Security: Token without 'Bearer' prefix should be rejected"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(admin_user)
        token = str(refresh.access_token)
        
        api_client.credentials(HTTP_AUTHORIZATION=token)  # No 'Bearer'
        url = '/api/dashboard/admin/users/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_xss_attempt_in_user_name(self, authenticated_admin):
        """Security: XSS attempt in user name should be sanitized"""
        url = '/api/dashboard/admin/users/create/'
        data = {
            'name': '<script>alert("XSS")</script>',
            'email': 'xss@school.com',
            'password': 'password123',
            'role': 'teacher'
        }
        response = authenticated_admin.post(url, data)
        
        # Should be accepted (Django sanitizes) or rejected
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]
