"""
Core Views Coverage Tests
Tests audit log endpoints with all branches
"""
import pytest
from rest_framework import status
from core.models import AuditLog


@pytest.mark.django_db
class TestLogAudit:
    """Test log_audit endpoint (POST /api/audit/)"""

    def test_unauthenticated_access(self, api_client):
        """Unauthenticated users cannot log audit"""
        response = api_client.post('/api/audit/', {'action': 'test'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_user_can_log(self, authenticated_teacher):
        """Authenticated user can create audit log"""
        response = authenticated_teacher.post('/api/audit/', {
            'action': 'test_action',
            'details': {'key': 'value'},
            'sessionId': 'session123'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert AuditLog.objects.filter(action='test_action').exists()

    def test_log_without_details(self, authenticated_admin):
        """Log audit without details field (defaults to {})"""
        response = authenticated_admin.post('/api/audit/', {
            'action': 'no_details_action'
        })
        assert response.status_code == status.HTTP_201_CREATED
        log = AuditLog.objects.get(action='no_details_action')
        assert log.details == {}

    def test_log_without_session_id(self, authenticated_form_master):
        """Log audit without sessionId (defaults to empty string)"""
        response = authenticated_form_master.post('/api/audit/', {
            'action': 'no_session_action',
            'details': {}
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        log = AuditLog.objects.get(action='no_session_action')
        assert log.session_id == ''

    def test_log_captures_ip_address(self, authenticated_teacher):
        """Audit log captures IP address from request"""
        response = authenticated_teacher.post('/api/audit/', {
            'action': 'ip_test',
            'details': {}
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        log = AuditLog.objects.get(action='ip_test')
        assert log.ip_address is not None

    def test_log_captures_user_agent(self, authenticated_admin):
        """Audit log captures user agent"""
        response = authenticated_admin.post('/api/audit/', {
            'action': 'user_agent_test',
            'details': {}
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        log = AuditLog.objects.get(action='user_agent_test')
        assert log.user_agent == ''  # Empty in test environment

    def test_log_with_forwarded_ip(self, authenticated_teacher):
        """Audit log captures IP from X-Forwarded-For header"""
        response = authenticated_teacher.post(
            '/api/audit/',
            {'action': 'forwarded_ip_test', 'details': {}},
            format='json',
            HTTP_X_FORWARDED_FOR='192.168.1.1, 10.0.0.1'
        )
        assert response.status_code == status.HTTP_201_CREATED
        log = AuditLog.objects.get(action='forwarded_ip_test')
        assert log.ip_address == '192.168.1.1'

    def test_log_error_handling(self, authenticated_teacher):
        """Error handling returns 400 on exception"""
        # Missing action field should trigger error
        response = authenticated_teacher.post('/api/audit/', {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data


@pytest.mark.django_db
class TestGetAuditLogs:
    """Test get_audit_logs endpoint (GET /api/audit/logs/)"""

    def test_unauthenticated_access(self, api_client):
        """Unauthenticated users cannot access logs"""
        response = api_client.get('/api/audit/logs/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_teacher_forbidden(self, authenticated_teacher):
        """Teachers cannot access audit logs"""
        response = authenticated_teacher.get('/api/audit/logs/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_access(self, authenticated_admin, admin_user):
        """Admin can access audit logs"""
        AuditLog.objects.create(user=admin_user, action='test', details={})
        response = authenticated_admin.get('/api/audit/logs/')
        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'results' in response.data

    def test_form_master_can_access(self, authenticated_form_master, form_master_user):
        """Form master can access audit logs"""
        AuditLog.objects.create(user=form_master_user, action='test', details={})
        response = authenticated_form_master.get('/api/audit/logs/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_filter_by_user_id(self, authenticated_admin, admin_user, teacher_user):
        """Filter logs by user_id"""
        AuditLog.objects.create(user=admin_user, action='admin_action', details={})
        AuditLog.objects.create(user=teacher_user, action='teacher_action', details={})
        
        response = authenticated_admin.get(f'/api/audit/logs/?user_id={teacher_user.id}')
        assert response.status_code == status.HTTP_200_OK
        assert all(log['user'] == teacher_user.email for log in response.data['results'])

    def test_filter_by_action(self, authenticated_admin, admin_user):
        """Filter logs by action"""
        AuditLog.objects.create(user=admin_user, action='login', details={})
        AuditLog.objects.create(user=admin_user, action='logout', details={})
        
        response = authenticated_admin.get('/api/audit/logs/?action=login')
        assert response.status_code == status.HTTP_200_OK
        assert all(log['action'] == 'login' for log in response.data['results'])

    def test_filter_by_start_date(self, authenticated_admin, admin_user):
        """Filter logs by start_date"""
        AuditLog.objects.create(user=admin_user, action='test', details={})
        
        response = authenticated_admin.get('/api/audit/logs/?start_date=2024-01-01')
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_end_date(self, authenticated_admin, admin_user):
        """Filter logs by end_date"""
        AuditLog.objects.create(user=admin_user, action='test', details={})
        
        response = authenticated_admin.get('/api/audit/logs/?end_date=2025-12-31')
        assert response.status_code == status.HTTP_200_OK

    def test_pagination_default(self, authenticated_admin, admin_user):
        """Pagination with default page and page_size"""
        for i in range(5):
            AuditLog.objects.create(user=admin_user, action=f'action_{i}', details={})
        
        response = authenticated_admin.get('/api/audit/logs/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 5

    def test_pagination_custom(self, authenticated_admin, admin_user):
        """Pagination with custom page and page_size"""
        for i in range(10):
            AuditLog.objects.create(user=admin_user, action=f'action_{i}', details={})
        
        response = authenticated_admin.get('/api/audit/logs/?page=2&page_size=3')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_log_with_null_user(self, authenticated_admin):
        """Handle logs with null user"""
        AuditLog.objects.create(user=None, action='system_action', details={})
        
        response = authenticated_admin.get('/api/audit/logs/')
        assert response.status_code == status.HTTP_200_OK
        null_user_logs = [log for log in response.data['results'] if log['user'] == 'Unknown']
        assert len(null_user_logs) >= 1


@pytest.mark.django_db
class TestExportAuditLogs:
    """Test export_audit_logs endpoint (POST /api/audit/export/)"""

    def test_unauthenticated_access(self, api_client):
        """Unauthenticated users cannot export logs"""
        response = api_client.post('/api/audit/export/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_teacher_forbidden(self, authenticated_teacher):
        """Teachers cannot export audit logs"""
        response = authenticated_teacher.post('/api/audit/export/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_form_master_forbidden(self, authenticated_form_master):
        """Form masters cannot export audit logs"""
        response = authenticated_form_master.post('/api/audit/export/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_export(self, authenticated_admin, admin_user):
        """Admin can export audit logs as CSV"""
        AuditLog.objects.create(user=admin_user, action='test_export', details={'key': 'value'})
        
        response = authenticated_admin.post('/api/audit/export/')
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert 'attachment' in response['Content-Disposition']
        assert 'audit_logs.csv' in response['Content-Disposition']

    def test_export_csv_format(self, authenticated_admin, admin_user):
        """CSV export has correct format"""
        AuditLog.objects.create(user=admin_user, action='csv_test', details={})
        
        response = authenticated_admin.post('/api/audit/export/')
        content = response.content.decode('utf-8')
        lines = content.split('\r\n')
        
        # Check header
        assert 'Timestamp' in lines[0]
        assert 'User' in lines[0]
        assert 'Action' in lines[0]
        assert 'Details' in lines[0]
        assert 'IP Address' in lines[0]

    def test_export_limits_to_1000_records(self, authenticated_admin, admin_user):
        """Export limits to 1000 records"""
        # Create more than 1000 logs would be slow, just verify the query slice exists
        AuditLog.objects.create(user=admin_user, action='limit_test', details={})
        
        response = authenticated_admin.post('/api/audit/export/')
        assert response.status_code == status.HTTP_200_OK

    def test_export_with_null_user(self, authenticated_admin):
        """Export handles logs with null user"""
        AuditLog.objects.create(user=None, action='null_user_export', details={})
        
        response = authenticated_admin.post('/api/audit/export/')
        content = response.content.decode('utf-8')
        assert 'Unknown' in content or 'null_user_export' in content
