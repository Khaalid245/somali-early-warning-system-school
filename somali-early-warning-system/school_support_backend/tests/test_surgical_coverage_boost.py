"""
Comprehensive Coverage Push Tests - Target 75%+
Focus on high-impact uncovered lines
"""
import pytest
from rest_framework import status
from django.test import Client
from datetime import date, timedelta
from users.models import User
from interventions.models import InterventionMeeting, InterventionCase
from students.models import Student


@pytest.mark.django_db
class TestInterventionMeetingValidation:
    """Target interventions/serializers.py lines 51, 58, 64-75, 81, 98, 153"""
    
    def test_follow_up_date_past_validation(self, student, form_master_user):
        """Hit line 51: past follow-up date validation"""
        from interventions.serializers import InterventionMeetingSerializer
        
        serializer = InterventionMeetingSerializer(data={
            'student': student.student_id,
            'meeting_date': date.today(),
            'absence_reason': 'test',
            'root_cause': 'attendance',
            'follow_up_date': date.today() - timedelta(days=1)  # Past date
        })
        
        assert not serializer.is_valid()
        assert 'follow_up_date' in serializer.errors
    
    def test_cannot_reopen_closed_meeting(self, student, form_master_user):
        """Hit lines 58, 64-75: cannot reopen closed cases"""
        from interventions.serializers import InterventionMeetingSerializer
        
        # Create closed meeting
        meeting = InterventionMeeting.objects.create(
            student=student,
            meeting_date=date.today(),
            absence_reason='test',
            root_cause='attendance',
            status='closed',
            created_by=form_master_user
        )
        
        # Try to reopen
        serializer = InterventionMeetingSerializer(meeting, data={
            'status': 'open'
        }, partial=True)
        
        assert not serializer.is_valid()
        assert 'status' in serializer.errors
    
    def test_student_required_validation(self):
        """Hit line 81: student required validation"""
        from interventions.serializers import InterventionMeetingSerializer
        
        serializer = InterventionMeetingSerializer(data={
            'meeting_date': date.today(),
            'absence_reason': 'test',
            'root_cause': 'attendance'
            # Missing student field
        })
        
        assert not serializer.is_valid()
        assert 'student' in serializer.errors
    
    def test_duplicate_active_intervention_validation(self, student, form_master_user):
        """Hit lines 98, 101: duplicate active intervention check"""
        from interventions.serializers import InterventionMeetingSerializer
        
        # Create existing active meeting
        InterventionMeeting.objects.create(
            student=student,
            meeting_date=date.today(),
            absence_reason='test',
            root_cause='attendance',
            status='open',
            created_by=form_master_user
        )
        
        # Try to create another with same root cause
        serializer = InterventionMeetingSerializer(data={
            'student': student.student_id,
            'meeting_date': date.today(),
            'absence_reason': 'test2',
            'root_cause': 'attendance',  # Same root cause
            'status': 'open'
        })
        
        assert not serializer.is_valid()
        assert 'non_field_errors' in serializer.errors
    
    def test_student_risk_level_no_profile(self, student):
        """Hit line 153: student risk level when no risk profile"""
        from interventions.serializers import InterventionCaseSerializer
        
        case = InterventionCase.objects.create(
            student=student,
            status='open'
        )
        
        serializer = InterventionCaseSerializer(case)
        assert serializer.data['student_risk_level'] == 'low'


@pytest.mark.django_db
class TestAuthRefreshEdgeCases:
    """Target users/views/auth.py lines 48-69"""
    
    def test_refresh_token_cookie_processing(self, admin_user):
        """Hit lines 48-69: refresh token cookie processing"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Generate valid refresh token
        refresh = RefreshToken.for_user(admin_user)
        
        client = Client()
        client.cookies['refresh_token'] = str(refresh)
        
        response = client.post('/api/auth/refresh/')
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.cookies
    
    def test_refresh_token_mutable_data_handling(self):
        """Hit lines 48-50: request.data._mutable handling"""
        client = Client()
        # This will trigger the mutable data handling in the refresh view
        response = client.post('/api/auth/refresh/', {'refresh': 'invalid'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserSerializerEdgeCases:
    """Target users/serializers.py lines 51-52"""
    
    def test_email_normalization_and_uniqueness(self):
        """Hit lines 18-24: email normalization and uniqueness check"""
        from users.serializers import UserSerializer
        
        # Create user with lowercase email
        User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123',
            role='teacher'
        )
        
        # Try to create with uppercase version of same email
        serializer = UserSerializer(data={
            'email': 'TEST@EXAMPLE.COM',  # Different case
            'name': 'Another User',
            'password': 'testpass123',
            'role': 'teacher'
        })
        
        assert not serializer.is_valid()
        assert 'email' in serializer.errors


@pytest.mark.django_db
class TestInterventionDashboardEdgeCases:
    """Target interventions/dashboard_view.py lines 107, 120-130"""
    
    def test_non_form_master_access_denied(self, authenticated_teacher):
        """Hit line 107: non-form master access denied"""
        response = authenticated_teacher.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_trend_calculation_zero_previous(self, authenticated_form_master, student, form_master_user):
        """Hit lines 120-130: trend calculation with zero previous cases"""
        # Create only current period case, no previous
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        # Should handle division by zero gracefully