"""
Surgical Test for users/serializers.py lines 51-52
Target: Email validation error handling
"""
import pytest


@pytest.mark.django_db
class TestUserSerializerValidation:
    """Target lines 51-52: Email validation error handling"""
    
    def test_invalid_email_validation_error(self):
        """Lines 51-52: Email validation error branch"""
        from users.serializers import UserSerializer
        
        # Invalid email format to trigger validation error
        data = {
            'email': 'not-an-email',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'teacher'
        }
        
        serializer = UserSerializer(data=data)
        
        # This triggers lines 51-52: validation error handling
        assert not serializer.is_valid()
        assert 'email' in serializer.errors