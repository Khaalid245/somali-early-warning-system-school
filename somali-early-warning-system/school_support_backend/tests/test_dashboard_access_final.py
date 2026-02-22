"""
Final High-Impact Test to Push Coverage Over 75%
Target: dashboard/views.py line 45 (97% → 100%)
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestDashboardAccessControl:
    """Target dashboard/views.py line 45: Non-admin access denial"""
    
    def test_teacher_denied_dashboard_access(self, authenticated_teacher):
        """Line 45: Teacher cannot access admin dashboard"""
        response = authenticated_teacher.get('/api/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_form_master_denied_dashboard_access(self, authenticated_form_master):
        """Line 45: Form master cannot access admin dashboard"""
        response = authenticated_form_master.get('/api/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN