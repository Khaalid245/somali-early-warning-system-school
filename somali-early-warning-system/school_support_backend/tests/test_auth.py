"""
Authentication Tests (JWT)
Tests JWT token generation, validation, and authentication boundaries

WHY THIS MATTERS:
- Authentication is the first line of defense
- JWT tokens must be properly validated
- Expired/invalid tokens must be rejected
- Prevents unauthorized access to the system
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.auth
class TestAuthentication:
    """Test JWT authentication flow"""

    @pytest.mark.django_db
    def test_login_with_valid_credentials(self, api_client, admin_user):
        """
        SECURITY: Valid credentials should generate JWT tokens
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'admin@school.com',
            'password': 'admin123'
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    @pytest.mark.django_db
    def test_login_with_invalid_credentials(self, api_client, admin_user):
        """
        SECURITY: Invalid credentials must be rejected
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'admin@school.com',
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_login_with_nonexistent_user(self, api_client):
        """
        SECURITY: Non-existent users must be rejected
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'nonexistent@school.com',
            'password': 'password123'
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_login_with_inactive_user(self, api_client, admin_user):
        """
        SECURITY: Inactive users must not be able to login
        """
        admin_user.is_active = False
        admin_user.save()
        
        url = reverse('token_obtain_pair')
        data = {
            'email': 'admin@school.com',
            'password': 'admin123'
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_access_protected_endpoint_without_token(self, api_client):
        """
        SECURITY: Protected endpoints must reject unauthenticated requests
        """
        url = '/api/users/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_access_protected_endpoint_with_valid_token(self, authenticated_admin):
        """
        SECURITY: Valid tokens should grant access to protected endpoints
        """
        url = '/api/users/'
        response = authenticated_admin.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_token_refresh(self, api_client, admin_user):
        """
        SECURITY: Refresh tokens should generate new access tokens
        """
        # Get initial tokens
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'admin@school.com',
            'password': 'admin123'
        }
        login_response = api_client.post(login_url, login_data)
        refresh_token = login_response.data['refresh']
        
        # Refresh token
        refresh_url = reverse('token_refresh')
        refresh_data = {'refresh': refresh_token}
        refresh_response = api_client.post(refresh_url, refresh_data)
        
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.data

    @pytest.mark.django_db
    def test_logout_blacklists_token(self, api_client, admin_user):
        """
        SECURITY: Logout should blacklist refresh tokens
        """
        # Login
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'admin@school.com',
            'password': 'admin123'
        }
        login_response = api_client.post(login_url, login_data)
        refresh_token = login_response.data['refresh']
        
        # Logout
        logout_url = reverse('logout')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_response.data["access"]}')
        logout_response = api_client.post(logout_url, {'refresh': refresh_token})
        
        assert logout_response.status_code == status.HTTP_200_OK
        
        # Try to use blacklisted token
        refresh_url = reverse('token_refresh')
        refresh_response = api_client.post(refresh_url, {'refresh': refresh_token})
        
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED
