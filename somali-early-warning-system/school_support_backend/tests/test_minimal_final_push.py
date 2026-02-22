"""
Minimal Final Push - 73% to 75%
Target only the highest impact lines
"""
import pytest
from rest_framework import status
from django.test import Client
from users.models import User


@pytest.mark.django_db
class TestMinimalCoveragePush:
    """Minimal tests for maximum coverage impact"""
    
    def test_user_create_validation_branches(self):
        """Hit users/managers.py validation branches"""
        # Test email validation
        with pytest.raises(ValueError, match="email"):
            User.objects.create_user(email='', name='Test', password='pass', role='teacher')
        
        # Test name validation  
        with pytest.raises(ValueError, match="name"):
            User.objects.create_user(email='test@test.com', name='', password='pass', role='teacher')
    
    def test_serializer_validation_errors(self):
        """Hit serializer validation branches"""
        from users.serializers import UserSerializer
        
        # Multiple validation errors
        serializer = UserSerializer(data={
            'email': 'invalid-email',
            'name': '',
            'password': '123',
            'role': 'invalid'
        })
        
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0
    
    def test_auth_refresh_edge_case(self):
        """Hit auth refresh edge case"""
        client = Client()
        response = client.post('/api/auth/refresh/', {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST