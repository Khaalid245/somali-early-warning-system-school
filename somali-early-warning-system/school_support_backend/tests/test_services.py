"""
Service Layer Tests
Tests business logic in services.py files (risk calculation, dashboard analytics)

WHY THIS MATTERS:
- Services contain core business logic
- Risk calculation drives the early warning system
- Dashboard analytics inform decision-making
- Bugs in services corrupt data and analytics
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone

from risk.services import (
    update_risk_after_session,
    _calculate_subject_streak,
    _calculate_full_day_streak,
    _update_subject_insight,
)
from dashboard.services import (
    calculate_percentage_change,
    get_trend_direction,
    get_admin_dashboard_data,
    get_form_master_dashboard_data,
    get_teacher_dashboard_data,
)
from attendance.models import AttendanceSession, AttendanceRecord
from risk.models import StudentRiskProfile, SubjectRiskInsight
from alerts.models import Alert
from interventions.models import InterventionCase


@pytest.mark.django_db
class TestRiskServices:
    """Test risk calculation business logic"""

    def test_subject_streak_calculation_no_absences(
        self, student, subject, classroom, teacher_user
    ):
        """Risk calculation: No absences = 0 streak"""
        # Create attendance records (all present)
        for i in range(5):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=date.today() - timedelta(days=i)
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status='present'
            )
        
        streak = _calculate_subject_streak(student, subject)
        assert streak == 0

    def test_subject_streak_calculation_consecutive_absences(
        self, student, subject, classroom, teacher_user
    ):
        """Risk calculation: Consecutive absences increase streak"""
        # Create 3 consecutive absences
        for i in range(3):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=date.today() - timedelta(days=i)
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status='absent'
            )
        
        streak = _calculate_subject_streak(student, subject)
        assert streak == 3

    def test_subject_streak_breaks_on_present(
        self, student, subject, classroom, teacher_user
    ):
        """Risk calculation: Streak breaks when student is present"""
        # Absent, Absent, Present, Absent
        statuses = ['absent', 'absent', 'present', 'absent']
        for i, status in enumerate(statuses):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=date.today() - timedelta(days=i)
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status=status
            )
        
        streak = _calculate_subject_streak(student, subject)
        assert streak == 2  # Only counts recent consecutive absences

    def test_full_day_streak_calculation(
        self, student, classroom, teacher_user
    ):
        """Risk calculation: Full day absences across all subjects"""
        from academics.models import Subject
        
        # Create 2 subjects
        math = Subject.objects.create(name='Math', code='MATH')
        science = Subject.objects.create(name='Science', code='SCI')
        
        # Day 1: Absent in both subjects
        for subj in [math, science]:
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subj,
                teacher=teacher_user,
                attendance_date=date.today()
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status='absent'
            )
        
        # Day 2: Present in math, absent in science (breaks streak)
        for subj, status in [(math, 'present'), (science, 'absent')]:
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subj,
                teacher=teacher_user,
                attendance_date=date.today() - timedelta(days=1)
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status=status
            )
        
        streak = _calculate_full_day_streak(student)
        assert streak == 1  # Only day 1 counts as full day absence

    def test_risk_profile_creation(
        self, student, subject, classroom, teacher_user, enrollment
    ):
        """Risk calculation: Creates risk profile on first attendance"""
        session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        AttendanceRecord.objects.create(
            session=session,
            student=student,
            status='absent'
        )
        
        update_risk_after_session(session)
        
        assert StudentRiskProfile.objects.filter(student=student).exists()
        profile = StudentRiskProfile.objects.get(student=student)
        assert profile.risk_level in ['low', 'medium', 'high', 'critical']

    def test_high_risk_triggers_alert(
        self, student, subject, classroom, teacher_user, enrollment, form_master_user
    ):
        """Risk calculation: High risk creates alert"""
        # Set classroom form master
        classroom.form_master = form_master_user
        classroom.save()
        
        # Create many absences to trigger high risk
        for i in range(10):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=date.today() - timedelta(days=i)
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status='absent'
            )
        
        # Trigger risk calculation on last session
        last_session = AttendanceSession.objects.filter(
            records__student=student
        ).order_by('-attendance_date').first()
        update_risk_after_session(last_session)
        
        # Should create alert
        assert Alert.objects.filter(
            student=student,
            alert_type='attendance'
        ).exists()

    def test_subject_insight_calculates_absence_rate(
        self, student, subject, classroom, teacher_user
    ):
        """Risk calculation: Absence rate is calculated correctly"""
        # 3 present, 2 absent = 40% absence rate
        for i, status in enumerate(['present', 'present', 'present', 'absent', 'absent']):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=date.today() - timedelta(days=i)
            )
            AttendanceRecord.objects.create(
                session=session,
                student=student,
                status=status
            )
        
        _update_subject_insight(student, subject)
        
        insight = SubjectRiskInsight.objects.get(student=student, subject=subject)
        assert insight.total_sessions == 5
        assert insight.absence_count == 2
        assert insight.absence_rate == Decimal('40.00')


@pytest.mark.django_db
class TestDashboardServices:
    """Test dashboard analytics business logic"""

    def test_percentage_change_calculation(self):
        """Analytics: Percentage change calculated correctly"""
        assert calculate_percentage_change(120, 100) == 20.0
        assert calculate_percentage_change(80, 100) == -20.0
        assert calculate_percentage_change(100, 100) == 0.0

    def test_percentage_change_from_zero(self):
        """Analytics: Handle division by zero"""
        assert calculate_percentage_change(50, 0) == 100
        assert calculate_percentage_change(0, 0) == 0

    def test_trend_direction(self):
        """Analytics: Trend direction determined correctly"""
        assert get_trend_direction(25) == 'up'
        assert get_trend_direction(-15) == 'down'
        assert get_trend_direction(0) == 'stable'

    def test_admin_dashboard_data_structure(self, admin_user):
        """Analytics: Admin dashboard returns correct structure"""
        data = get_admin_dashboard_data(admin_user, {})
        
        assert 'role' in data
        assert data['role'] == 'admin'
        assert 'total_students' in data
        assert 'active_alerts' in data
        assert 'open_cases' in data
        assert 'monthly_alert_trend' in data
        assert 'monthly_case_trend' in data

    def test_form_master_dashboard_data_structure(self, form_master_user):
        """Analytics: Form master dashboard returns correct structure"""
        data = get_form_master_dashboard_data(form_master_user, {})
        
        assert 'role' in data
        assert data['role'] == 'form_master'
        assert 'assigned_alerts' in data
        assert 'open_cases' in data
        assert 'high_risk_count' in data
        assert 'urgent_alerts' in data
        assert 'pending_cases' in data

    def test_teacher_dashboard_data_structure(self, teacher_user):
        """Analytics: Teacher dashboard returns correct structure"""
        data = get_teacher_dashboard_data(teacher_user, {})
        
        assert 'role' in data
        assert data['role'] == 'teacher'
        assert 'today_absent_count' in data
        assert 'active_alerts' in data
        assert 'monthly_absence_trend' in data
        assert 'high_risk_students' in data

    def test_admin_dashboard_counts_alerts(
        self, admin_user, student, subject, form_master_user
    ):
        """Analytics: Admin dashboard counts active alerts"""
        # Create alerts
        Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            status='active',
            assigned_to=form_master_user
        )
        Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='medium',
            status='resolved',
            assigned_to=form_master_user
        )
        
        data = get_admin_dashboard_data(admin_user, {})
        
        assert data['active_alerts'] == 1  # Only active, not resolved

    def test_form_master_dashboard_shows_only_assigned(
        self, form_master_user, another_form_master, student, subject
    ):
        """Analytics: Form master sees only their assigned alerts"""
        # Create alert for form_master_user
        Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            status='active',
            assigned_to=form_master_user
        )
        
        # Create alert for another_form_master
        Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            status='active',
            assigned_to=another_form_master
        )
        
        data = get_form_master_dashboard_data(form_master_user, {})
        
        assert data['assigned_alerts'] == 1  # Only their own
