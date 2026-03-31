"""
Integration Tests — School Early Warning System
Tests the full HTTP request → view → database → response flow.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from students.models import Student, StudentEnrollment
from academics.models import Classroom, Subject


class AuthIntegrationTest(TestCase):
    """Test full login/logout HTTP flow"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='admin@test.com',
            name='Admin User',
            role='admin',
            password='Admin@1234'
        )

    def test_login_returns_jwt(self):
        """POST /api/auth/login/ → 200 with token"""
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'Admin@1234'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('role', response.data)

    def test_login_wrong_password_returns_401(self):
        """POST /api/auth/login/ with wrong password → 401"""
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_without_auth_returns_401(self):
        """GET /api/students/ without token → 401"""
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StudentIntegrationTest(TestCase):
    """Test student API endpoints end-to-end"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin2@test.com',
            name='Admin',
            role='admin',
            password='Admin@1234'
        )
        self.client.force_authenticate(user=self.admin)

    def test_list_students_returns_200(self):
        """GET /api/students/ → 200"""
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_student_returns_201(self):
        """POST /api/students/ → 201"""
        response = self.client.post('/api/students/', {
            'admission_number': 'INT001',
            'full_name': 'Integration Student',
            'gender': 'male'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Student.objects.filter(admission_number='INT001').count(), 1)


class DashboardIntegrationTest(TestCase):
    """Test dashboard API endpoint end-to-end"""

    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            email='teacher@test.com',
            name='Teacher',
            role='teacher',
            password='Admin@1234'
        )
        self.client.force_authenticate(user=self.teacher)

    def test_dashboard_returns_200(self):
        """GET /api/dashboard/ → 200 with role-based data"""
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('role', response.data)
        self.assertEqual(response.data['role'], 'teacher')
