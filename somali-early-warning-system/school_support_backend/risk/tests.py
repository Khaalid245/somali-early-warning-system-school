from django.test import TestCase
from django.contrib.auth import get_user_model
from students.models import Student, Classroom
from academics.models import Subject
from attendance.models import AttendanceSession, AttendanceRecord
from risk.models import RiskAssessment
from risk.services import calculate_risk_score
from datetime import date, timedelta

User = get_user_model()

class RiskCalculationTestCase(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher1',
            email='teacher@test.com',
            password='test123',
            role='teacher'
        )
        
        self.classroom = Classroom.objects.create(
            name='Grade 10A',
            grade_level=10
        )
        
        self.subject = Subject.objects.create(
            name='Mathematics',
            code='MATH101'
        )
        
        self.student = Student.objects.create(
            full_name='Test Student',
            date_of_birth=date(2008, 1, 1),
            gender='M'
        )
    
    def test_risk_score_calculation_no_absences(self):
        """Test risk score with no absences"""
        risk = RiskAssessment.objects.create(
            student=self.student,
            subject=self.subject,
            absence_rate=0.0,
            subject_absence_streak=0,
            full_day_absence_streak=0
        )
        
        score = calculate_risk_score(risk)
        self.assertEqual(score, 0)
        self.assertEqual(risk.risk_level, 'low')
    
    def test_risk_score_high_threshold(self):
        """Test risk score reaches high threshold"""
        risk = RiskAssessment.objects.create(
            student=self.student,
            subject=self.subject,
            absence_rate=30.0,
            subject_absence_streak=5,
            full_day_absence_streak=3
        )
        
        score = calculate_risk_score(risk)
        self.assertGreaterEqual(score, 55)
        self.assertIn(risk.risk_level, ['high', 'critical'])
    
    def test_risk_score_critical_threshold(self):
        """Test risk score reaches critical threshold"""
        risk = RiskAssessment.objects.create(
            student=self.student,
            subject=self.subject,
            absence_rate=50.0,
            subject_absence_streak=8,
            full_day_absence_streak=6
        )
        
        score = calculate_risk_score(risk)
        self.assertGreaterEqual(score, 75)
        self.assertEqual(risk.risk_level, 'critical')
    
    def test_attendance_creates_risk_assessment(self):
        """Test that attendance session triggers risk calculation"""
        session = AttendanceSession.objects.create(
            classroom=self.classroom,
            subject=self.subject,
            teacher=self.teacher,
            attendance_date=date.today()
        )
        
        AttendanceRecord.objects.create(
            session=session,
            student=self.student,
            status='absent'
        )
        
        # Risk assessment should be created/updated
        risk_exists = RiskAssessment.objects.filter(
            student=self.student,
            subject=self.subject
        ).exists()
        
        self.assertTrue(risk_exists)
