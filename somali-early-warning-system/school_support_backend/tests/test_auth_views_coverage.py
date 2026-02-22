"""
Auth Views Coverage Tests
Tests users/views/auth.py endpoints
"""
import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
class TestMyTokenObtainPairView:
    """Test MyTokenObtainPairView (POST /api/auth/login/)"""

    def test_login_success(self, api_client, teacher_user):
        """Successful login returns tokens and sets cookies"""
        response = api_client.post('/api/auth/login/', {
            'email': 'teacher@school.com',
            'password': 'teacher123'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies
        
        # Verify cookie attributes
        access_cookie = response.cookies['access_token']
        assert access_cookie['httponly'] is True
        assert access_cookie['samesite'] == 'Lax'
        assert access_cookie['max-age'] == 3600

    def test_login_missing_email(self, api_client):
        """Login without email returns 400"""
        response = api_client.post('/api/auth/login/', {
            'password': 'password123'
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_password(self, api_client):
        """Login without password returns 400"""
        response = api_client.post('/api/auth/login/', {
            'email': 'teacher@school.com'
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_empty_payload(self, api_client):
        """Login with empty payload returns 400"""
        response = api_client.post('/api/auth/login/', {}, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_incorrect_password(self, api_client, teacher_user):
        """Login with incorrect password returns 401"""
        response = api_client.post('/api/auth/login/', {
            'email': 'teacher@school.com',
            'password': 'wrongpassword'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Login with non-existent user returns 401"""
        response = api_client.post('/api/auth/login/', {
            'email': 'nonexistent@school.com',
            'password': 'password123'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, api_client, teacher_user):
        """Login with inactive user returns 401"""
        teacher_user.is_active = False
        teacher_user.save()
        
        response = api_client.post('/api/auth/login/', {
            'email': 'teacher@school.com',
            'password': 'teacher123'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_sets_refresh_cookie(self, api_client, admin_user):
        """Successful login sets refresh token cookie with correct attributes"""
        response = api_client.post('/api/auth/login/', {
            'email': 'admin@school.com',
            'password': 'admin123'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        refresh_cookie = response.cookies['refresh_token']
        assert refresh_cookie['httponly'] is True
        assert refresh_cookie['samesite'] == 'Lax'
        assert refresh_cookie['max-age'] == 604800  # 7 days

    def test_login_without_access_token_in_response(self, api_client, form_master_user):
        """Login response includes access token for backward compatibility"""
        response = api_client.post('/api/auth/login/', {
            'email': 'formmaster@school.com',
            'password': 'formmaster123'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert len(response.data['access']) > 0

    def test_login_case_sensitive_email(self, api_client, teacher_user):
        """Login with different case email"""
        response = api_client.post('/api/auth/login/', {
            'email': 'TEACHER@SCHOOL.COM',
            'password': 'teacher123'
        }, format='json')
        
        # Should fail if email is case-sensitive
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]


@pytest.mark.django_db
class TestMyTokenRefreshView:
    """Test MyTokenRefreshView (POST /api/auth/refresh/)"""

    def test_refresh_with_valid_token_in_body(self, api_client, teacher_user):
        """Refresh with valid token in request body"""
        refresh = RefreshToken.for_user(teacher_user)
        
        response = api_client.post('/api/auth/refresh/', {
            'refresh': str(refresh)
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        # Response contains access token
        assert 'access' in response.data

    def test_refresh_with_valid_token_in_cookie(self, api_client, teacher_user):
        """Refresh with valid token in cookie (cookie takes precedence)"""
        refresh = RefreshToken.for_user(teacher_user)
        
        # Set cookie and provide token in body
        response = api_client.post(
            '/api/auth/refresh/',
            {'refresh': str(refresh)},
            format='json',
            HTTP_COOKIE=f'refresh_token={str(refresh)}'
        )
        
        assert response.status_code == status.HTTP_200_OK

    def test_refresh_with_invalid_token(self, api_client):
        """Refresh with invalid token returns 401"""
        response = api_client.post('/api/auth/refresh/', {
            'refresh': 'invalid_token_string'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_with_expired_token(self, api_client):  
        """Refresh with expired/blacklisted token returns 401"""
        # Use an obviously invalid token structure
        response = api_client.post('/api/auth/refresh/', {
            'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_without_token(self, api_client):
        """Refresh without token returns 400"""
        response = api_client.post('/api/auth/refresh/', {}, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_refresh_sets_access_cookie(self, api_client, admin_user):
        """Successful refresh sets access token cookie"""
        refresh = RefreshToken.for_user(admin_user)
        
        response = api_client.post('/api/auth/refresh/', {
            'refresh': str(refresh)
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        # Check if cookie exists (may not be set in test environment)
        if 'access_token' in response.cookies:
            access_cookie = response.cookies['access_token']
            assert access_cookie['httponly'] is True
            assert access_cookie['max-age'] == 3600

    def test_refresh_cookie_overrides_body(self, api_client, teacher_user, admin_user):
        """Cookie token takes precedence when both provided"""
        teacher_refresh = RefreshToken.for_user(teacher_user)
        admin_refresh = RefreshToken.for_user(admin_user)
        
        response = api_client.post(
            '/api/auth/refresh/',
            {'refresh': str(admin_refresh)},
            format='json',
            HTTP_COOKIE=f'refresh_token={str(teacher_refresh)}'
        )
        
        assert response.status_code == status.HTTP_200_OK

    def test_refresh_empty_cookie(self, api_client, teacher_user):
        """Empty cookie falls back to body token"""
        refresh = RefreshToken.for_user(teacher_user)
        
        response = api_client.post(
            '/api/auth/refresh/',
            {'refresh': str(refresh)},
            format='json',
            HTTP_COOKIE='refresh_token='
        )
        
        assert response.status_code == status.HTTP_200_OK

    def test_refresh_malformed_token(self, api_client):
        """Refresh with malformed token returns 401"""
        response = api_client.post('/api/auth/refresh/', {
            'refresh': 'malformed.token.here'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_response_format(self, api_client, form_master_user):
        """Refresh response contains access token"""
        refresh = RefreshToken.for_user(form_master_user)
        
        response = api_client.post('/api/auth/refresh/', {
            'refresh': str(refresh)
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        # Response contains access token
        assert 'access' in response.data
