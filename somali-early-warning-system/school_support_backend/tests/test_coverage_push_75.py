"""
Surgical Coverage Tests to Push from 73% to 75%+
Target specific uncovered lines with minimal tests
"""
import pytest
from rest_framework import status
from django.test import Client
from users.models import User


@pytest.mark.django_db
class TestUserSerializerValidation:
    """Target users/serializers.py lines 51-52"""
    
    def test_duplicate_email_validation(self):
        """Hit line 51: duplicate email check"""
        from users.serializers import UserSerializer
        
        # Create existing user
        User.objects.create_user(
            email='test@example.com',
            name='Existing User',
            password='testpass123',
            role='teacher'
        )
        
        # Try to create another with same email
        serializer = UserSerializer(data={
            'email': 'test@example.com',
            'name': 'New User',
            'password': 'testpass123',
            'role': 'teacher'
        })
        
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
    
    def test_change_password_validation_failure(self):
        """Hit line 52: password validation in ChangePasswordSerializer"""
        from users.serializers import ChangePasswordSerializer
        
        serializer = ChangePasswordSerializer(data={
            'current_password': 'oldpass',
            'new_password': '123'  # Too weak
        })
        
        assert not serializer.is_valid()
        assert 'new_password' in serializer.errors


@pytest.mark.django_db 
class TestAuthRefreshTokenCookie:
    """Target users/views/auth.py lines 48-69"""
    
    def test_refresh_without_cookie_fails(self):
        """Hit lines 48-50: no refresh token in cookie"""
        client = Client()
        response = client.post('/api/auth/refresh/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_refresh_with_invalid_cookie_fails(self):
        """Hit lines 48-69: invalid refresh token processing"""
        client = Client()
        client.cookies['refresh_token'] = 'invalid_token'
        response = client.post('/api/auth/refresh/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestInterventionSerializerEdgeCases:
    """Target interventions/serializers.py missing lines"""
    
    def test_student_required_validation(self):
        """Hit line 81: student required validation"""
        from interventions.serializers import InterventionCaseSerializer
        
        serializer = InterventionCaseSerializer(data={
            'status': 'open'
            # Missing student field
        })
        
        assert not serializer.is_valid()
        assert 'student' in serializer.errors