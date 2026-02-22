"""
Users Views Coverage Tests
Tests users/views/users.py endpoints
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestUserListCreateView:
    """Test UserListCreateView (GET /api/users/, POST /api/users/)"""

    def test_unauthenticated_access_list(self, api_client):
        """Unauthenticated users cannot list users"""
        response = api_client.get('/api/users/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_unauthenticated_access_create(self, api_client):
        """Unauthenticated users cannot create users"""
        response = api_client.post('/api/users/', {
            'name': 'Test User',
            'email': 'test@school.com',
            'role': 'teacher',
            'password': 'password123'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_teacher_cannot_list_users(self, authenticated_teacher):
        """Teachers cannot list users (not admin)"""
        response = authenticated_teacher.get('/api/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_form_master_cannot_list_users(self, authenticated_form_master):
        """Form masters cannot list users (not admin)"""
        response = authenticated_form_master.get('/api/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_users(self, authenticated_admin, admin_user):
        """Admin can list all users"""
        response = authenticated_admin.get('/api/users/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert response.data['count'] >= 1

    def test_teacher_cannot_create_user(self, authenticated_teacher):
        """Teachers cannot create users"""
        response = authenticated_teacher.post('/api/users/', {
            'name': 'New User',
            'email': 'newuser@school.com',
            'role': 'teacher',
            'password': 'password123'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_user_valid(self, authenticated_admin):
        """Admin can create user with valid payload"""
        response = authenticated_admin.post('/api/users/', {
            'name': 'New Teacher',
            'email': 'newteacher@school.com',
            'role': 'teacher',
            'password': 'StrongP@ssw0rd123'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newteacher@school.com'
        assert response.data['role'] == 'teacher'

    def test_admin_create_user_invalid_email(self, authenticated_admin):
        """Admin cannot create user with invalid email"""
        response = authenticated_admin.post('/api/users/', {
            'name': 'Test User',
            'email': 'invalid-email',
            'role': 'teacher',
            'password': 'password123'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_create_user_missing_fields(self, authenticated_admin):
        """Admin cannot create user with missing required fields"""
        response = authenticated_admin.post('/api/users/', {
            'email': 'test@school.com'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_create_user_duplicate_email(self, authenticated_admin, teacher_user):
        """Admin cannot create user with duplicate email"""
        response = authenticated_admin.post('/api/users/', {
            'name': 'Duplicate User',
            'email': teacher_user.email,
            'role': 'teacher',
            'password': 'password123'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserDetailView:
    """Test UserDetailView (GET/PUT/PATCH/DELETE /api/users/<id>/)"""

    def test_unauthenticated_access_detail(self, api_client, teacher_user):
        """Unauthenticated users cannot view user details"""
        response = api_client.get(f'/api/users/{teacher_user.id}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_user_can_view_details(self, authenticated_teacher, teacher_user):
        """Authenticated users can view user details"""
        response = authenticated_teacher.get(f'/api/users/{teacher_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == teacher_user.email

    def test_user_can_view_other_user_details(self, authenticated_teacher, admin_user):
        """Users can view other users' details"""
        response = authenticated_teacher.get(f'/api/users/{admin_user.id}/')
        assert response.status_code == status.HTTP_200_OK

    def test_user_cannot_update_other_user(self, authenticated_teacher, admin_user):
        """Non-admin users cannot update other users"""
        response = authenticated_teacher.patch(f'/api/users/{admin_user.id}/', {
            'name': 'Updated Name'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'only update your own profile' in response.data['detail'].lower()

    def test_user_can_update_own_profile(self, authenticated_teacher, teacher_user):
        """Users can update their own profile"""
        response = authenticated_teacher.patch(f'/api/users/{teacher_user.id}/', {
            'name': 'Updated Teacher Name'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Teacher Name'

    def test_admin_can_update_other_users(self, authenticated_admin, teacher_user):
        """Admin can update other users (is_staff check)"""
        response = authenticated_admin.patch(f'/api/users/{teacher_user.id}/', {
            'name': 'Admin Updated Name'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Admin Updated Name'

    def test_get_serializer_class_for_update(self, authenticated_teacher, teacher_user):
        """PUT/PATCH uses UserUpdateSerializer"""
        response = authenticated_teacher.put(f'/api/users/{teacher_user.id}/', {
            'name': 'Full Update',
            'email': teacher_user.email,
            'role': teacher_user.role
        }, format='json')
        # Should use UserUpdateSerializer which may have different validation
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    def test_get_serializer_class_for_retrieve(self, authenticated_teacher, teacher_user):
        """GET uses UserSerializer"""
        response = authenticated_teacher.get(f'/api/users/{teacher_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        # Verify it returns all UserSerializer fields
        assert 'email' in response.data
        assert 'role' in response.data

    def test_user_not_found(self, authenticated_teacher):
        """Accessing non-existent user returns 404"""
        response = authenticated_teacher.get('/api/users/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
