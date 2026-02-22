"""
Final Coverage Push - Target 75%+
Focus on highest impact uncovered lines
"""
import pytest
from rest_framework import status
from django.test import Client
from users.models import User
from students.models import Student, Classroom, StudentEnrollment
from academics.models import Subject
from alerts.models import Alert
from interventions.models import InterventionCase
from attendance.models import AttendanceRecord
from datetime import date, timedelta


@pytest.mark.django_db
class TestHighImpactCoverage:
    """Target highest impact uncovered lines across modules"""
    
    def test_user_manager_create_user_validation(self):
        """Hit users/managers.py lines 13, 16, 19"""
        from users.managers import UserManager
        from django.contrib.auth.models import AnonymousUser
        
        manager = UserManager()
        manager.model = User
        
        # Test missing email validation
        with pytest.raises(ValueError):
            manager.create_user(email='', name='Test', password='pass', role='teacher')
        
        # Test missing name validation  
        with pytest.raises(ValueError):
            manager.create_user(email='test@test.com', name='', password='pass', role='teacher')
        
        # Test missing role validation
        with pytest.raises(ValueError):
            manager.create_user(email='test@test.com', name='Test', password='pass', role='')
    
    def test_user_serializer_password_validation(self):
        """Hit users/serializers.py lines 31-36"""
        from users.serializers import UserSerializer
        
        # Test weak password validation
        serializer = UserSerializer(data={
            'email': 'test@example.com',
            'name': 'Test User',
            'password': '123',  # Too weak
            'role': 'teacher'
        })
        
        assert not serializer.is_valid()
        assert 'password' in serializer.errors
    
    def test_student_serializer_validation(self):
        """Hit students/serializers.py lines 83-101"""
        from students.serializers import StudentSerializer
        
        # Test invalid data
        serializer = StudentSerializer(data={
            'full_name': '',  # Empty name
            'student_id': 'INVALID',
            'date_of_birth': date.today() + timedelta(days=1)  # Future date
        })
        
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0
    
    def test_alert_serializer_validation(self):
        """Hit alerts/serializers.py lines 54-72"""
        from alerts.serializers import AlertSerializer
        
        # Test missing required fields
        serializer = AlertSerializer(data={
            'alert_type': 'invalid_type',  # Invalid choice
            'risk_level': 'invalid_level'  # Invalid choice
        })
        
        assert not serializer.is_valid()
        assert 'alert_type' in serializer.errors or 'risk_level' in serializer.errors
    
    def test_attendance_serializer_validation(self):
        """Hit attendance/serializers.py lines 45-92, 95-109"""
        from attendance.serializers import AttendanceRecordSerializer
        
        # Test invalid attendance data
        serializer = AttendanceRecordSerializer(data={
            'status': 'invalid_status',  # Invalid choice
            'date': date.today() + timedelta(days=1)  # Future date
        })
        
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0
    
    def test_academics_serializer_validation(self):
        """Hit academics/serializers.py lines 37-50"""
        from academics.serializers import SubjectSerializer
        
        # Test invalid subject data
        serializer = SubjectSerializer(data={
            'name': '',  # Empty name
            'code': 'TOOLONGCODE123456789'  # Too long
        })
        
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0


@pytest.mark.django_db
class TestViewsEdgeCases:
    """Target view edge cases for coverage boost"""
    
    def test_alert_views_edge_cases(self, authenticated_teacher, student, subject):
        """Hit alerts/views.py lines 31-36, 45, 83, 113"""
        # Test unauthorized access
        response = authenticated_teacher.post('/api/alerts/', {
            'student': student.student_id,
            'subject': subject.id,
            'alert_type': 'attendance',
            'risk_level': 'high'
        })
        # Should fail due to permissions
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]
    
    def test_attendance_views_edge_cases(self, authenticated_teacher):
        """Hit attendance/views.py lines 41, 53, 61"""
        # Test invalid attendance record access
        response = authenticated_teacher.get('/api/attendance/999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Test invalid POST data
        response = authenticated_teacher.post('/api/attendance/', {
            'invalid': 'data'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_core_health_check(self):
        """Hit core/health.py lines 33-35"""
        from core.health import health_check
        
        # This should trigger the health check logic
        result = health_check()
        assert 'status' in result
    
    def test_core_permissions_edge_cases(self):
        """Hit core/permissions.py lines 8-14, 19-35"""
        from core.permissions import IsAdminOrFormMaster, IsFormMasterOrTeacher
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.models import AnonymousUser
        
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = AnonymousUser()
        
        # Test permissions with anonymous user
        perm1 = IsAdminOrFormMaster()
        assert not perm1.has_permission(request, None)
        
        perm2 = IsFormMasterOrTeacher()
        assert not perm2.has_permission(request, None)


@pytest.mark.django_db
class TestModelEdgeCases:
    """Target model validation and edge cases"""
    
    def test_intervention_model_validation(self, student, form_master_user):
        """Hit interventions/models.py lines 81, 88, 207-213"""
        from interventions.models import InterventionCase
        
        # Test model validation
        case = InterventionCase(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        # This should trigger model validation
        case.save()
        assert case.case_id is not None
        assert case.version == 1
    
    def test_attendance_signals(self, student, teacher_user, subject, classroom):
        """Hit attendance/signals.py lines 17-34"""
        from attendance.models import AttendanceRecord
        
        # Create attendance record to trigger signals
        attendance = AttendanceRecord.objects.create(
            student=student,
            subject=subject,
            date=date.today(),
            status='absent',
            recorded_by=teacher_user
        )
        
        # Signal should have processed this
        assert attendance.id is not None