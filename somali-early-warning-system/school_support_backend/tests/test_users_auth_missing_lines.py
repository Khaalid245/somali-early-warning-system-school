"""
Surgical Coverage Tests for users/views/auth.py
Missing lines: 48-69 (62% coverage)
Target: MyTokenRefreshView branches
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestMyTokenRefreshViewMissingLines:
    """Target uncovered branches in MyTokenRefreshView"""
    
    def test_refresh_token_no_cookie_provided(self, api_client):
        """Lines 48-52: No refresh token in cookie"""
        # Test refresh without cookie
        response = api_client.post('/api/auth/refresh/')
        
        # Should fail because no refresh token provided
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_refresh_token_cookie_with_failure_response(self, api_client):
        """Lines 48-56: Cookie provided but refresh fails"""
        # Set invalid refresh token in cookie
        api_client.cookies['refresh_token'] = 'invalid_token'
        
        response = api_client.post('/api/auth/refresh/')
        
        # Should fail with 400 (bad request due to invalid token format)
        assert response.status_code == status.HTTP_400_BAD_REQUEST