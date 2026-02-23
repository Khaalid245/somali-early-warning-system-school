import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from users.models import User
from students.models import Student, StudentEnrollment
from academics.models import Classroom, Subject, TeachingAssignment
from alerts.models import Alert
from risk.models import StudentRiskProfile
from attendance.models import AttendanceRecord, AttendanceSession
from dashboard.services import get_teacher_dashboard_data


class TestEnhancedTeacherDashboard(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            email='teacher@test.com',
            name='Test Teacher',
            role='teacher',
            password='testpass123'
        )
        
        self.classroom = Classroom.objects.create(
            name='Test Class',
            academic_year='2024'
        )
        
        self.subject = Subject.objects.create(name='Math')
        
        self.assignment = TeachingAssignment.objects.create(
            teacher=self.teacher,
            classroom=self.classroom,
            subject=self.subject
        )
        
        self.student = Student.objects.create(
            admission_number='S001',
            full_name='Test Student',
            gender='male'
        )
        
        StudentEnrollment.objects.create(
            student=self.student,
            classroom=self.classroom,
            academic_year='2024'
        )

    def test_teacher_specific_features(self):
        """Test new teacher-specific features"""
        from django.core.cache import cache
        cache.clear()
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Check teacher-specific features are present
        assert 'pending_attendance_sessions' in result
        assert 'student_progress_alerts' in result
        assert 'weekly_attendance_summary' in result
        assert 'action_items' in result
        
        # Check my_classes has enhanced data
        assert len(result['my_classes']) == 1
        class_data = result['my_classes'][0]
        assert 'student_count' in class_data
        assert 'recent_attendance_rate' in class_data

    def test_time_range_functionality(self):
        """Test semester/term view functionality"""
        from django.core.cache import cache
        cache.clear()
        
        # Test different time ranges
        filters = {'time_range': 'current_semester'}
        result = get_teacher_dashboard_data(self.teacher, filters)
        
        assert 'time_range_info' in result
        assert result['time_range_info']['range_name'] == 'current_semester'
        assert 'display_name' in result['time_range_info']
        assert 'start_date' in result['time_range_info']
        assert 'end_date' in result['time_range_info']

    def test_visual_indicators_and_context(self):
        """Test visual indicators and contextual data"""
        from django.core.cache import cache
        cache.clear()
        
        # Create high-risk student with alert
        risk_profile = StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='high',
            risk_score=75.0
        )
        
        alert = Alert.objects.create(
            student=self.student,
            subject=self.subject,
            alert_type='attendance',
            risk_level='high',
            status='active'
        )
        
        # Create attendance session for context
        session = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            attendance_date=timezone.now().date(),
            teacher=self.teacher
        )
        
        AttendanceRecord.objects.create(
            student=self.student,
            session=session,
            status='absent'
        )
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Check high-risk students have visual indicators
        if result['high_risk_students']:
            student_data = result['high_risk_students'][0]
            assert 'visual_indicator' in student_data
            assert 'context' in student_data
            assert 'urgency_level' in student_data
            
            # Check visual indicator structure
            visual = student_data['visual_indicator']
            assert 'color' in visual
            assert 'icon' in visual
            assert 'badge' in visual
            assert 'priority' in visual

        # Check urgent alerts have visual indicators
        if result['urgent_alerts']:
            alert_data = result['urgent_alerts'][0]
            assert 'visual_indicator' in alert_data
            assert 'days_since_created' in alert_data
            assert 'urgency_score' in alert_data

    def test_action_items_generation(self):
        """Test that action items are generated correctly"""
        from django.core.cache import cache
        cache.clear()
        
        # Create scenario with absences and alerts
        session = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            attendance_date=timezone.now().date(),
            teacher=self.teacher
        )
        
        AttendanceRecord.objects.create(
            student=self.student,
            session=session,
            status='absent'
        )
        
        Alert.objects.create(
            student=self.student,
            subject=self.subject,
            alert_type='attendance',
            risk_level='high',
            status='active'
        )
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Check action items are generated
        assert 'action_items' in result
        assert len(result['action_items']) > 0
        
        # Check action item structure
        action_item = result['action_items'][0]
        assert 'type' in action_item
        assert 'priority' in action_item
        assert 'message' in action_item
        assert 'count' in action_item

    def test_weekly_attendance_summary(self):
        """Test weekly attendance summary functionality"""
        from django.core.cache import cache
        cache.clear()
        
        # Create attendance data for the week
        today = timezone.now().date()
        session = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            attendance_date=today,
            teacher=self.teacher
        )
        
        AttendanceRecord.objects.create(
            student=self.student,
            session=session,
            status='present'
        )
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        # Check weekly summary structure
        assert 'weekly_attendance_summary' in result
        weekly_data = result['weekly_attendance_summary']
        assert len(weekly_data) == 7  # 7 days
        
        # Check daily data structure
        day_data = weekly_data[0]
        assert 'date' in day_data
        assert 'day_name' in day_data
        assert 'total' in day_data
        assert 'present' in day_data
        assert 'absent' in day_data
        assert 'late' in day_data
        assert 'attendance_rate' in day_data