import pytest
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch

from users.models import User
from students.models import Student, StudentEnrollment
from academics.models import Classroom, Subject, TeachingAssignment
from dashboard.services import get_teacher_dashboard_data


class TestTeacherDashboardImprovements(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            email='teacher@test.com',
            name='Test Teacher',
            role='teacher',
            password='testpass123'
        )

    def test_empty_dashboard_with_guidance(self):
        """Test that teachers with no assignments get helpful guidance"""
        from django.core.cache import cache
        cache.clear()  # Clear cache to ensure fresh data
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Check that we get helpful guidance
        assert result['status'] == 'no_assignments'
        assert result['contact_admin'] == True
        assert 'message' in result
        assert len(result['onboarding_steps']) > 0
        assert 'administrator' in result['message']

    def test_dashboard_with_assignments(self):
        """Test that teachers with assignments get proper dashboard"""
        # Create test data
        classroom = Classroom.objects.create(
            name='Test Class',
            academic_year='2024'
        )
        subject = Subject.objects.create(name='Math')
        
        TeachingAssignment.objects.create(
            teacher=self.teacher,
            classroom=classroom,
            subject=subject
        )
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Check that we get proper dashboard data
        assert result['role'] == 'teacher'
        assert 'status' not in result  # No status means normal operation
        assert len(result['my_classes']) == 1
        assert result['my_classes'][0]['subject__name'] == 'Math'

    @patch('dashboard.services.get_cached_dashboard_data')
    def test_caching_is_used(self, mock_cache):
        """Test that caching is properly implemented"""
        mock_cache.return_value = {'cached': True}
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Should return cached data
        assert result == {'cached': True}
        mock_cache.assert_called_once()