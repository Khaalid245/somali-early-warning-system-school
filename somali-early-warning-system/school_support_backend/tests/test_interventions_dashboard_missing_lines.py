"""
Targeted Coverage Tests for interventions/dashboard_view.py
Missing lines: 107, 120-130, 163-167
"""
import pytest
from rest_framework import status
from unittest.mock import patch


@pytest.mark.django_db
class TestFormMasterDashboardViewMissingLines:
    """Target specific uncovered branches in dashboard_view.py"""
    
    def test_non_form_master_access_denied(self, authenticated_teacher):
        """Line 107: if user.role != 'form_master': return Response({'error': 'Access denied'}, status=403)"""
        response = authenticated_teacher.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['error'] == 'Access denied'
    
    def test_new_cases_trend_calculation_with_zero_prev_cases(self, authenticated_form_master, form_master_user, student):
        """Lines 120-130: new_cases_trend calculation when prev_month_stats['prev_new_cases'] > 0"""
        from interventions.models import InterventionCase
        from django.utils import timezone
        from datetime import timedelta
        
        # Create a case in the last month to trigger trend calculation
        last_month = timezone.now() - timedelta(days=15)
        InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open',
            created_at=last_month
        )
        
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_200_OK
        # This should trigger the trend calculation branch
        assert 'trends' in response.data['statistics']
    
    @patch('interventions.dashboard_view.InterventionCase.objects.select_related')
    def test_dashboard_exception_handling(self, mock_select_related, authenticated_form_master):
        """Lines 163-167: Exception handling in dashboard view"""
        mock_select_related.side_effect = Exception("Database error")
        
        response = authenticated_form_master.get('/api/interventions/dashboard/')
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response.data['error'] == 'Failed to load dashboard'
        assert 'Database error' in response.data['detail']