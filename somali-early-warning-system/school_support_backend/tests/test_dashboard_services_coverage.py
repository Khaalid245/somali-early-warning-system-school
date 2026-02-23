import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from users.models import User
from students.models import Student, StudentEnrollment
from academics.models import Classroom, Subject, TeachingAssignment
from alerts.models import Alert
from interventions.models import InterventionCase
from risk.models import StudentRiskProfile
from attendance.models import AttendanceRecord, AttendanceSession
from dashboard.services import get_form_master_dashboard_data, get_teacher_dashboard_data


class TestDashboardServicesCoverage(TestCase):
    def setUp(self):
        self.form_master = User.objects.create_user(
            email='fm@test.com',
            name='Form Master',
            role='form_master',
            password='testpass123'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', 
            name='Teacher',
            role='teacher',
            password='testpass123'
        )
        
        self.classroom = Classroom.objects.create(
            name='Class A',
            form_master=self.form_master,
            academic_year='2024'
        )
        
        self.subject = Subject.objects.create(name='Math')
        
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

    def test_form_master_dashboard_high_risk_students_no_risk_profile(self):
        """Test form master dashboard when student has no risk profile"""
        # Student without risk profile should be skipped
        result = get_form_master_dashboard_data(self.form_master, {})
        
        assert result['high_risk_count'] == 0
        assert len(result['high_risk_students']) == 0

    def test_form_master_dashboard_high_risk_students_low_risk(self):
        """Test form master dashboard when student has low risk"""
        StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='low',
            risk_score=10.0
        )
        
        result = get_form_master_dashboard_data(self.form_master, {})
        
        assert result['high_risk_count'] == 0
        assert len(result['high_risk_students']) == 0

    def test_form_master_dashboard_high_risk_students_with_intervention(self):
        """Test high risk student with existing intervention"""
        risk_profile = StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='high',
            risk_score=70.0
        )
        
        # Create intervention case
        InterventionCase.objects.create(
            student=self.student,
            assigned_to=self.form_master,
            status='open',
            follow_up_date=timezone.now().date() - timedelta(days=10)  # Overdue
        )
        
        # Create attendance records
        session = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            attendance_date=timezone.now().date(),
            teacher=self.form_master
        )
        AttendanceRecord.objects.create(
            student=self.student,
            session=session,
            status='absent'
        )
        
        # Create second session for present record
        session2 = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            attendance_date=timezone.now().date() - timedelta(days=1),
            teacher=self.form_master
        )
        AttendanceRecord.objects.create(
            student=self.student,
            session=session2,
            status='present'
        )
        
        # Create active alert
        Alert.objects.create(
            student=self.student,
            subject=self.subject,
            alert_type='attendance',
            risk_level='high',
            status='active',
            assigned_to=self.form_master
        )
        
        result = get_form_master_dashboard_data(self.form_master, {})
        
        assert result['high_risk_count'] == 1
        student_data = result['high_risk_students'][0]
        assert student_data['has_intervention'] == True
        assert student_data['days_since_followup'] == 10
        assert student_data['active_alerts_count'] == 1
        assert student_data['priority_score'] > 70  # Base score + overdue + alert bonuses

    def test_form_master_dashboard_high_risk_students_no_intervention(self):
        """Test high risk student without intervention gets priority boost"""
        StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='critical',
            risk_score=80.0
        )
        
        result = get_form_master_dashboard_data(self.form_master, {})
        
        assert result['high_risk_count'] == 1
        student_data = result['high_risk_students'][0]
        assert student_data['has_intervention'] == False
        assert student_data['priority_score'] == 100.0  # 80 + 20 boost

    def test_form_master_dashboard_classroom_stats_critical_risk(self):
        """Test classroom stats with critical average risk"""
        StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='critical',
            risk_score=70.0
        )
        
        result = get_form_master_dashboard_data(self.form_master, {})
        
        classroom_stat = result['classroom_stats'][0]
        assert classroom_stat['health_status'] == 'critical'
        assert classroom_stat['avg_risk_score'] == 70.0

    def test_form_master_dashboard_classroom_stats_moderate_risk(self):
        """Test classroom stats with moderate average risk"""
        StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='medium',
            risk_score=40.0
        )
        
        result = get_form_master_dashboard_data(self.form_master, {})
        
        classroom_stat = result['classroom_stats'][0]
        assert classroom_stat['health_status'] == 'moderate'

    def test_form_master_dashboard_immediate_attention_overdue(self):
        """Test immediate attention list includes overdue cases"""
        StudentRiskProfile.objects.create(
            student=self.student,
            risk_level='high',
            risk_score=60.0
        )
        
        InterventionCase.objects.create(
            student=self.student,
            assigned_to=self.form_master,
            status='open',
            follow_up_date=timezone.now().date() - timedelta(days=10)
        )
        
        result = get_form_master_dashboard_data(self.form_master, {})
        
        assert len(result['immediate_attention']) == 1

    def test_teacher_dashboard_no_subjects(self):
        """Test teacher dashboard when no subjects assigned"""
        result = get_teacher_dashboard_data(self.teacher, {})
        
        assert result['role'] == 'teacher'
        assert result['today_absent_count'] == 0
        assert result['active_alerts'] == 0
        assert result['monthly_absence_trend'] == []
        assert result['high_risk_students'] == []
        assert result['urgent_alerts'] == []
        assert result['my_classes'] == []

    def test_teacher_dashboard_with_subjects_and_data(self):
        """Test teacher dashboard with assigned subjects and data"""
        # Create separate student for this test
        teacher_student = Student.objects.create(
            admission_number='T001',
            full_name='Teacher Test Student',
            gender='female'
        )
        
        StudentEnrollment.objects.create(
            student=teacher_student,
            classroom=self.classroom,
            academic_year='2024'
        )
        
        # Assign teacher to subject
        TeachingAssignment.objects.create(
            teacher=self.teacher,
            classroom=self.classroom,
            subject=self.subject
        )
        
        # Create attendance session and records
        session = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            attendance_date=timezone.now().date(),
            teacher=self.teacher
        )
        AttendanceRecord.objects.create(
            student=teacher_student,
            session=session,
            status='absent'
        )
        
        # Create alert
        Alert.objects.create(
            student=teacher_student,
            subject=self.subject,
            alert_type='attendance',
            risk_level='high',
            status='active'
        )
        
        # Create risk profile
        StudentRiskProfile.objects.create(
            student=teacher_student,
            risk_level='high',
            risk_score=70.0
        )
        
        result = get_teacher_dashboard_data(self.teacher, {})
        
        assert result['role'] == 'teacher'
        assert result['today_absent_count'] == 1
        assert result['active_alerts'] == 1
        assert len(result['urgent_alerts']) == 1
        assert len(result['my_classes']) == 1
        assert len(result['high_risk_students']) == 1