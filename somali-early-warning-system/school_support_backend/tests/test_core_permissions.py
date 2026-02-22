"""
Test Coverage for core/permissions.py
Targets: @require_role and @validate_resource_ownership decorators
Coverage Goal: 95%+ branch coverage
"""
import pytest
import json
from django.http import JsonResponse
from core.permissions import require_role, validate_resource_ownership
from alerts.models import Alert


@pytest.mark.permissions
class TestRequireRoleDecorator:
    """Test @require_role decorator enforcement across all branches"""
    
    @pytest.mark.django_db
    def test_unauthenticated_user_returns_401(self, api_client):
        """Branch: if not request.user.is_authenticated"""
        
        @require_role('admin')
        def mock_view(request):
            return JsonResponse({'success': True})
        
        # Create mock request without authentication
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = type('User', (), {'is_authenticated': False})()
        
        response = mock_view(request)
        assert response.status_code == 401
        assert 'Authentication required' in response.content.decode()
    
    @pytest.mark.django_db
    def test_wrong_role_returns_403(self, api_client, teacher_user):
        """Branch: if request.user.role not in allowed_roles"""
        
        @require_role('admin')
        def mock_view(request):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = teacher_user  # Teacher trying to access admin endpoint
        
        response = mock_view(request)
        assert response.status_code == 403
        assert 'Insufficient permissions' in response.content.decode()
    
    @pytest.mark.django_db
    def test_correct_role_returns_200(self, api_client, admin_user):
        """Branch: return view_func(request, *args, **kwargs)"""
        
        @require_role('admin')
        def mock_view(request):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = admin_user
        
        response = mock_view(request)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['success'] is True
    
    @pytest.mark.django_db
    def test_multiple_allowed_roles_teacher(self, api_client, teacher_user):
        """Branch: Multiple roles in allowed_roles (teacher)"""
        
        @require_role('admin', 'teacher', 'form_master')
        def mock_view(request):
            return JsonResponse({'role': request.user.role})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = teacher_user
        
        response = mock_view(request)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['role'] == 'teacher'
    
    @pytest.mark.django_db
    def test_multiple_allowed_roles_form_master(self, api_client, form_master_user):
        """Branch: Multiple roles in allowed_roles (form_master)"""
        
        @require_role('admin', 'form_master')
        def mock_view(request):
            return JsonResponse({'role': request.user.role})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = form_master_user
        
        response = mock_view(request)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['role'] == 'form_master'


@pytest.mark.permissions
class TestValidateResourceOwnershipDecorator:
    """Test @validate_resource_ownership decorator enforcement"""
    
    @pytest.mark.django_db
    def test_resource_not_found_returns_404(self, api_client, teacher_user):
        """Branch: except model.DoesNotExist"""
        
        @validate_resource_ownership(Alert, id_param='pk', owner_field='assigned_to')
        def mock_view(request, pk):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = teacher_user
        
        response = mock_view(request, pk=99999)  # Non-existent ID
        assert response.status_code == 404
        assert 'Resource not found' in response.content.decode()
    
    @pytest.mark.django_db
    def test_non_owner_non_admin_returns_403(self, api_client, teacher_user, other_teacher_user, classroom, student):
        """Branch: if owner != request.user and request.user.role != 'admin'"""
        
        # Create alert owned by other_teacher
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='medium',
            assigned_to=other_teacher_user
        )
        
        @validate_resource_ownership(Alert, id_param='pk', owner_field='assigned_to')
        def mock_view(request, pk):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = teacher_user  # Different teacher
        
        response = mock_view(request, pk=alert.alert_id)
        assert response.status_code == 403
        assert 'Not authorized for this resource' in response.content.decode()
    
    @pytest.mark.django_db
    def test_owner_accesses_own_resource_returns_200(self, api_client, teacher_user, student):
        """Branch: owner == request.user"""
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='medium',
            assigned_to=teacher_user
        )
        
        @validate_resource_ownership(Alert, id_param='pk', owner_field='assigned_to')
        def mock_view(request, pk):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = teacher_user
        
        response = mock_view(request, pk=alert.alert_id)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['success'] is True
    
    @pytest.mark.django_db
    def test_admin_bypasses_ownership_check_returns_200(self, api_client, admin_user, teacher_user, student):
        """Branch: request.user.role == 'admin' bypass"""
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='medium',
            assigned_to=teacher_user  # Owned by teacher
        )
        
        @validate_resource_ownership(Alert, id_param='pk', owner_field='assigned_to')
        def mock_view(request, pk):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = admin_user  # Admin accessing teacher's resource
        
        response = mock_view(request, pk=alert.alert_id)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['success'] is True
    
    @pytest.mark.django_db
    def test_custom_id_param_name(self, api_client, teacher_user, student):
        """Branch: Custom id_param (not 'pk')"""
        
        alert = Alert.objects.create(
            student=student,
            alert_type='attendance',
            risk_level='medium',
            assigned_to=teacher_user
        )
        
        @validate_resource_ownership(Alert, id_param='alert_id', owner_field='assigned_to')
        def mock_view(request, alert_id):
            return JsonResponse({'success': True})
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = teacher_user
        
        response = mock_view(request, alert_id=alert.alert_id)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['success'] is True
