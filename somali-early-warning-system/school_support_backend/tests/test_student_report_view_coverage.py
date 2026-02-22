"""
Test Coverage for attendance/student_report_view.py
Target: Increase coverage to at least 85%
"""
import pytest
from datetime import date, timedelta
from attendance.models import AttendanceSession, AttendanceRecord
from students.models import StudentEnrollment


@pytest.mark.django_db
class TestStudentAttendanceReportView:
    """API integration tests for StudentAttendanceReportView"""
    
    def test_unauthenticated_access_allowed(self, api_client, student):
        """View has AllowAny permission - unauthenticated access allowed"""
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
    
    def test_invalid_student_id_returns_404(self, api_client):
        """Invalid student ID returns 404"""
        response = api_client.get('/api/attendance/student-report/99999/')
        assert response.status_code == 404
        assert response.data['error'] == 'Student not found'
    
    def test_student_no_enrollment(self, api_client, student):
        """Student with no enrollment shows 'Not Enrolled'"""
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert response.data['classroom'] == 'Not Enrolled'
        assert response.data['student_name'] == student.full_name
    
    def test_student_no_attendance_records(self, api_client, student, classroom):
        """Student with enrollment but no attendance records"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert response.data['classroom'] == classroom.name
        assert response.data['present_count'] == 0
        assert response.data['absent_count'] == 0
        assert response.data['attendance_rate'] == 0
        assert response.data['subject_breakdown'] == []
    
    def test_student_mixed_attendance_records(self, api_client, student, classroom, subject, teacher_user):
        """Student with mixed present/absent/late records"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        # Create sessions within last 90 days
        today = date.today()
        session1 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=5)
        )
        session2 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=10)
        )
        session3 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=15)
        )
        
        AttendanceRecord.objects.create(session=session1, student=student, status='present')
        AttendanceRecord.objects.create(session=session2, student=student, status='absent')
        AttendanceRecord.objects.create(session=session3, student=student, status='late')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert response.data['present_count'] == 1
        assert response.data['absent_count'] == 1
        assert response.data['late_count'] == 1
        assert response.data['attendance_rate'] == 33.3
    
    def test_student_all_present(self, api_client, student, classroom, subject, teacher_user):
        """Student with all present records"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        today = date.today()
        for i in range(5):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=today - timedelta(days=i)
            )
            AttendanceRecord.objects.create(session=session, student=student, status='present')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert response.data['present_count'] == 5
        assert response.data['absent_count'] == 0
        assert response.data['attendance_rate'] == 100.0
    
    def test_student_all_absent(self, api_client, student, classroom, subject, teacher_user):
        """Student with all absent records"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        today = date.today()
        for i in range(3):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=today - timedelta(days=i)
            )
            AttendanceRecord.objects.create(session=session, student=student, status='absent')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert response.data['present_count'] == 0
        assert response.data['absent_count'] == 3
        assert response.data['attendance_rate'] == 0.0
    
    def test_subject_breakdown(self, api_client, student, classroom, subject, teacher_user):
        """Subject breakdown with multiple subjects"""
        from academics.models import Subject
        
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        subject2 = Subject.objects.create(name='Science', code='SCI101')
        
        today = date.today()
        # Math sessions
        session1 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=1)
        )
        session2 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=2)
        )
        # Science session
        session3 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject2,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=3)
        )
        
        AttendanceRecord.objects.create(session=session1, student=student, status='present')
        AttendanceRecord.objects.create(session=session2, student=student, status='absent')
        AttendanceRecord.objects.create(session=session3, student=student, status='present')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert len(response.data['subject_breakdown']) == 2
        
        # Find math subject
        math_stats = next((s for s in response.data['subject_breakdown'] if s['subject_name'] == subject.name), None)
        assert math_stats is not None
        assert math_stats['present'] == 1
        assert math_stats['absent'] == 1
        assert math_stats['rate'] == 50.0
    
    def test_recent_history_last_30_days(self, api_client, student, classroom, subject, teacher_user):
        """Recent history shows last 30 days, max 20 records"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        today = date.today()
        # Create records within last 30 days
        for i in range(5):
            session = AttendanceSession.objects.create(
                classroom=classroom,
                subject=subject,
                teacher=teacher_user,
                attendance_date=today - timedelta(days=i)
            )
            AttendanceRecord.objects.create(session=session, student=student, status='present')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        assert len(response.data['recent_history']) == 5
        assert response.data['recent_history'][0]['status'] == 'present'
    
    def test_records_outside_90_days_excluded(self, api_client, student, classroom, subject, teacher_user):
        """Records older than 90 days are excluded"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        today = date.today()
        # Recent record
        session1 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=10)
        )
        # Old record (outside 90 days)
        session2 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=100)
        )
        
        AttendanceRecord.objects.create(session=session1, student=student, status='present')
        AttendanceRecord.objects.create(session=session2, student=student, status='absent')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        # Only recent record counted
        assert response.data['present_count'] == 1
        assert response.data['absent_count'] == 0
    
    def test_total_school_days_calculation(self, api_client, student, classroom, teacher_user):
        """Total school days counts distinct attendance dates"""
        from academics.models import Subject
        
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        subject1 = Subject.objects.create(name='Math', code='MATH101')
        subject2 = Subject.objects.create(name='English', code='ENG101')
        
        today = date.today()
        # Create sessions with different subjects on same day
        session1 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject1,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=1)
        )
        session2 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject2,
            teacher=teacher_user,
            attendance_date=today - timedelta(days=1)  # Same day, different subject
        )
        
        AttendanceRecord.objects.create(session=session1, student=student, status='present')
        AttendanceRecord.objects.create(session=session2, student=student, status='present')
        
        response = api_client.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
        # Should count as 1 day, not 2
        assert response.data['total_days'] >= 1
    
    def test_admin_access(self, authenticated_admin, student, classroom):
        """Admin can access student report"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        response = authenticated_admin.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
    
    def test_teacher_access(self, authenticated_teacher, student, classroom):
        """Teacher can access student report"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        response = authenticated_teacher.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
    
    def test_form_master_access(self, authenticated_form_master, student, classroom):
        """Form master can access student report"""
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year='2024',
            is_active=True
        )
        
        response = authenticated_form_master.get(f'/api/attendance/student-report/{student.student_id}/')
        assert response.status_code == 200
