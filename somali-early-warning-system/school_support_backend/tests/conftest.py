"""
Pytest Fixtures for School Support Backend Testing
Provides reusable test data and authentication helpers
"""
import pytest
import django
import os

# Configure Django settings before importing models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.test_settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.hashers import make_password
from users.models import User
from students.models import Student, Classroom, StudentEnrollment
from academics.models import Subject, TeachingAssignment
from datetime import date


@pytest.fixture
def api_client():
    """Provides DRF API client for making requests"""
    return APIClient()


# =====================================================
# USER FIXTURES (RBAC)
# =====================================================

@pytest.fixture
def admin_user(db):
    """Create admin user"""
    return User.objects.create(
        name="Admin User",
        email="admin@school.com",
        password=make_password("admin123"),
        role="admin",
        is_active=True,
        is_staff=True
    )


@pytest.fixture
def teacher_user(db):
    """Create teacher user"""
    return User.objects.create(
        name="Teacher User",
        email="teacher@school.com",
        password=make_password("teacher123"),
        role="teacher",
        is_active=True
    )


@pytest.fixture
def form_master_user(db):
    """Create form master user"""
    return User.objects.create(
        name="Form Master User",
        email="formmaster@school.com",
        password=make_password("formmaster123"),
        role="form_master",
        is_active=True
    )


@pytest.fixture
def another_form_master(db):
    """Create another form master for IDOR testing"""
    return User.objects.create(
        name="Another Form Master",
        email="formmaster2@school.com",
        password=make_password("formmaster123"),
        role="form_master",
        is_active=True
    )


@pytest.fixture
def other_teacher_user(db):
    """Create another teacher for IDOR testing"""
    return User.objects.create(
        name="Other Teacher",
        email="teacher2@school.com",
        password=make_password("teacher123"),
        role="teacher",
        is_active=True
    )


@pytest.fixture
def other_form_master_user(db):
    """Alias for another_form_master for consistency"""
    return User.objects.create(
        name="Other Form Master",
        email="formmaster3@school.com",
        password=make_password("formmaster123"),
        role="form_master",
        is_active=True
    )


# =====================================================
# CLASSROOM & STUDENT FIXTURES
# =====================================================

@pytest.fixture
def classroom(db, form_master_user):
    """Create classroom with form master"""
    return Classroom.objects.create(
        name="Grade 10A",
        academic_year="2024",
        form_master=form_master_user,
        is_active=True
    )


@pytest.fixture
def another_classroom(db, another_form_master):
    """Create another classroom for IDOR testing"""
    return Classroom.objects.create(
        name="Grade 10B",
        academic_year="2024",
        form_master=another_form_master,
        is_active=True
    )


@pytest.fixture
def student(db):
    """Create student"""
    return Student.objects.create(
        admission_number="STU001",
        full_name="John Doe",
        gender="male",
        status="active",
        is_active=True
    )


@pytest.fixture
def enrollment(db, student, classroom):
    """Enroll student in classroom"""
    return StudentEnrollment.objects.create(
        student=student,
        classroom=classroom,
        academic_year="2024",
        is_active=True
    )


# =====================================================
# SUBJECT & TEACHING ASSIGNMENT FIXTURES
# =====================================================

@pytest.fixture
def subject(db):
    """Create subject"""
    return Subject.objects.create(
        name="Mathematics",
        code="MATH101"
    )


@pytest.fixture
def teaching_assignment(db, teacher_user, classroom, subject):
    """Assign teacher to classroom and subject"""
    return TeachingAssignment.objects.create(
        teacher=teacher_user,
        classroom=classroom,
        subject=subject,
        is_active=True
    )


# =====================================================
# AUTHENTICATION HELPERS
# =====================================================

@pytest.fixture
def authenticated_admin(api_client, admin_user):
    """API client authenticated as admin"""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def authenticated_teacher(api_client, teacher_user):
    """API client authenticated as teacher"""
    api_client.force_authenticate(user=teacher_user)
    return api_client


@pytest.fixture
def authenticated_form_master(api_client, form_master_user):
    """API client authenticated as form master"""
    api_client.force_authenticate(user=form_master_user)
    return api_client


@pytest.fixture
def authenticated_another_form_master(api_client, another_form_master):
    """API client authenticated as another form master (for IDOR tests)"""
    api_client.force_authenticate(user=another_form_master)
    return api_client
