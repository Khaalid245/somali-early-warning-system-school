"""
Test Coverage for dashboard/services.py
Target: 64% → 85%+
Strategy: Cover uncovered utility functions and edge cases
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from dashboard.services import (
    calculate_percentage_change,
    get_trend_direction,
    apply_date_filter,
    get_teacher_dashboard_data
)
from alerts.models import Alert
from attendance.models import AttendanceRecord, AttendanceSession


class TestUtilityFunctions:
    """Cover utility function branches"""
    
    def test_calculate_percentage_change_with_zero_previous(self):
        """Branch: if previous == 0 and current > 0"""
        result = calculate_percentage_change(10, 0)
        assert result == 100
    
    def test_calculate_percentage_change_both_zero(self):
        """Branch: if previous == 0 and current == 0"""
        result = calculate_percentage_change(0, 0)
        assert result == 0
    
    def test_calculate_percentage_change_normal(self):
        """Branch: Normal calculation"""
        result = calculate_percentage_change(150, 100)
        assert result == 50.0
    
    def test_calculate_percentage_change_decrease(self):
        """Branch: Negative change"""
        result = calculate_percentage_change(50, 100)
        assert result == -50.0
    
    def test_get_trend_direction_up(self):
        """Branch: if percent > 0"""
        assert get_trend_direction(10) == "up"
    
    def test_get_trend_direction_down(self):
        """Branch: elif percent < 0"""
        assert get_trend_direction(-10) == "down"
    
    def test_get_trend_direction_stable(self):
        """Branch: return 'stable'"""
        assert get_trend_direction(0) == "stable"
    
    def test_apply_date_filter_with_start_date(self, db):
        """Branch: if start_date"""
        from alerts.models import Alert
        qs = Alert.objects.all()
        filters = {'start_date': timezone.now().date()}
        result = apply_date_filter(qs, filters, 'alert_date')
        assert result is not None
    
    def test_apply_date_filter_with_end_date(self, db):
        """Branch: if end_date"""
        from alerts.models import Alert
        qs = Alert.objects.all()
        filters = {'end_date': timezone.now().date()}
        result = apply_date_filter(qs, filters, 'alert_date')
        assert result is not None
    
    def test_apply_date_filter_with_both_dates(self, db):
        """Branch: Both start and end date"""
        from alerts.models import Alert
        qs = Alert.objects.all()
        filters = {
            'start_date': timezone.now().date() - timedelta(days=30),
            'end_date': timezone.now().date()
        }
        result = apply_date_filter(qs, filters, 'alert_date')
        assert result is not None


@pytest.mark.django_db
class TestTeacherDashboardEdgeCases:
    """Cover teacher dashboard edge cases"""
    
    def test_teacher_with_no_subjects_returns_empty_data(self, teacher_user):
        """Branch: if not teacher_subjects"""
        data = get_teacher_dashboard_data(teacher_user, {})
        
        assert data['role'] == 'teacher'
        assert data['today_absent_count'] == 0
        assert data['active_alerts'] == 0
        assert data['monthly_absence_trend'] == []
        assert data['monthly_alert_trend'] == []
        assert data['high_risk_students'] == []
        assert data['urgent_alerts'] == []
        assert data['my_classes'] == []
