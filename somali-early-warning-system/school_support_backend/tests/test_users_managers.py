"""
Test Coverage for users/managers.py
Target: 60% → 100%
Strategy: Cover validation branches in create_user and create_superuser
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserManager:
    """Cover UserManager branches"""
    
    def test_create_user_success(self):
        """Branch: Happy path for create_user"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            role='teacher',
            password='password123'
        )
        assert user.email == 'test@example.com'
        assert user.name == 'Test User'
        assert user.role == 'teacher'
        assert user.check_password('password123')
    
    def test_create_user_without_email_fails(self):
        """Branch: if not email"""
        with pytest.raises(ValueError, match="must have an email"):
            User.objects.create_user(
                email='',
                name='Test',
                role='teacher',
                password='pass'
            )
    
    def test_create_user_without_password_fails(self):
        """Branch: if not password"""
        with pytest.raises(ValueError, match="must have a password"):
            User.objects.create_user(
                email='test@example.com',
                name='Test',
                role='teacher',
                password=''
            )
    
    def test_create_user_with_invalid_role_fails(self):
        """Branch: if role not in dict(self.model.ROLE_CHOICES)"""
        with pytest.raises(ValueError, match="Invalid role"):
            User.objects.create_user(
                email='test@example.com',
                name='Test',
                role='invalid_role',
                password='pass'
            )
    
    def test_normalize_email_lowercase_and_strip(self):
        """Branch: normalize_email processing"""
        user = User.objects.create_user(
            email='  TEST@EXAMPLE.COM  ',
            name='Test',
            role='teacher',
            password='pass'
        )
        assert user.email == 'test@example.com'
    
    def test_create_superuser_success(self):
        """Branch: create_superuser happy path"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass'
        )
        assert user.email == 'admin@example.com'
        assert user.role == 'admin'
        assert user.is_staff is True
        assert user.is_superuser is True
        assert user.name == 'Admin'
    
    def test_create_superuser_with_custom_name(self):
        """Branch: extra_fields.setdefault processing"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='pass',
            name='Custom Admin'
        )
        assert user.name == 'Custom Admin'
    
    def test_create_superuser_with_non_admin_role_fails(self):
        """Branch: if extra_fields.get('role') != 'admin'"""
        with pytest.raises(ValueError, match="must have role='admin'"):
            User.objects.create_superuser(
                email='admin@example.com',
                password='pass',
                role='teacher'
            )
