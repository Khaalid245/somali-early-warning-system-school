"""
Test Coverage for users/serializers.py - Email Validation
Tests email normalization, format validation, and uniqueness checks
"""
import pytest
from rest_framework.exceptions import ValidationError
from users.serializers import UserSerializer
from users.models import User


@pytest.mark.django_db
class TestUserEmailValidation:
    """Test email validation in UserSerializer"""
    
    def test_email_normalized_to_lowercase(self):
        """Email should be normalized to lowercase"""
        data = {
            'name': 'Test User',
            'email': 'Test.User@SCHOOL.COM',
            'role': 'teacher',
            'password': 'SecurePass123!'
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'test.user@school.com'
    
    def test_duplicate_email_different_case_rejected(self):
        """Duplicate email with different casing should be rejected"""
        # Create first user
        User.objects.create_user(
            email='teacher@school.com',
            name='Teacher One',
            role='teacher',
            password='Pass123!'
        )
        
        # Try to create second user with same email (different case)
        data = {
            'name': 'Teacher Two',
            'email': 'TEACHER@SCHOOL.COM',
            'role': 'teacher',
            'password': 'Pass456!'
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
        assert 'already exists' in str(serializer.errors['email'][0]).lower()
    
    def test_invalid_email_format_rejected(self):
        """Invalid email format should be rejected"""
        data = {
            'name': 'Test User',
            'email': 'not-an-email',
            'role': 'teacher',
            'password': 'SecurePass123!'
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
    
    def test_email_with_whitespace_trimmed(self):
        """Email with leading/trailing whitespace should be trimmed"""
        data = {
            'name': 'Test User',
            'email': '  teacher@school.com  ',
            'role': 'teacher',
            'password': 'SecurePass123!'
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'teacher@school.com'
    
    def test_valid_email_accepted(self):
        """Valid email should be accepted"""
        data = {
            'name': 'Test User',
            'email': 'valid.email@school.com',
            'role': 'teacher',
            'password': 'SecurePass123!'
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'valid.email@school.com'
    
    def test_empty_email_rejected(self):
        """Empty email should be rejected"""
        data = {
            'name': 'Test User',
            'email': '',
            'role': 'teacher',
            'password': 'SecurePass123!'
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
    
    def test_missing_email_rejected(self):
        """Missing email should be rejected"""
        data = {
            'name': 'Test User',
            'role': 'teacher',
            'password': 'SecurePass123!'
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors
