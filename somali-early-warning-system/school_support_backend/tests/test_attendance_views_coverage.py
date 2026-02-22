"""
Test Coverage for attendance/views.py
Targets: AttendanceSessionListCreateView queryset filtering and perform_create validation
Coverage Goal: 90%+ branch coverage
"""
import pytest
from datetime import date
from attendance.models import AttendanceSession, AttendanceRecord
from academics.models import TeachingAssignment, Subject
from students.models import Student, StudentEnrollment


@pytest.mark.attendance
class TestAttendanceSessionListCreateViewQueryset:
    """Test role-based queryset filtering in get_queryset()"""
    
    def test_admin_sees_all_sessions(self, api_client, admin_user, classroom, subject, teacher_user):
        """Branch: if user.role == 'admin'"""
        
        # Create sessions by different teachers
        session1 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        other_teacher = teacher_user.__class__.objects.create(
            name='Other Teacher',
            email='other@test.com',
            role='teacher'
        )
        session2 = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=other_teacher,
            attendance_date=date(2024, 1, 15)
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data['results']) >= 2  # Admin sees all
    
    def test_teacher_sees_only_their_sessions(self, api_client, teacher_user, classroom, subject):
        """Branch: if user.role == 'teacher'"""
        
        # Create session by this teacher
        my_session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        # Create session by other teacher
        other_teacher = teacher_user.__class__.objects.create(
            name='Other Teacher 2',
            email='other2@test.com',
            role='teacher'
        )
        other_session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=other_teacher,
            attendance_date=date(2024, 1, 15)
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        session_ids = [s['session_id'] for s in response.data['results']]
        assert my_session.session_id in session_ids
        assert other_session.session_id not in session_ids
    
    def test_form_master_sees_classroom_sessions(self, api_client, form_master_user, classroom, subject, teacher_user):
        """Branch: if user.role == 'form_master'"""
        
        # Assign form master to classroom
        classroom.form_master = form_master_user
        classroom.save()
        
        # Create session in their classroom
        my_classroom_session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        # Create session in other classroom
        other_classroom = classroom.__class__.objects.create(
            name='Other Class',
            academic_year='2024',
            form_master=None
        )
        other_session = AttendanceSession.objects.create(
            classroom=other_classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date(2024, 1, 15)
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=form_master_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        session_ids = [s['session_id'] for s in response.data['results']]
        assert my_classroom_session.session_id in session_ids
        assert other_session.session_id not in session_ids
    
    def test_unknown_role_sees_no_sessions(self, api_client, classroom, subject, teacher_user):
        """Branch: return AttendanceSession.objects.none()"""
        
        # Create user with invalid role
        unknown_user = teacher_user.__class__.objects.create(
            name='Unknown User',
            email='unknown@test.com',
            role='student'  # Invalid role
        )
        
        AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=unknown_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data['results']) == 0


@pytest.mark.attendance
class TestAttendanceSessionListCreateViewPerformCreate:
    """Test validation logic in perform_create()"""
    
    def test_non_teacher_cannot_create_session(self, api_client, form_master_user, classroom, subject):
        """Branch: if user.role != 'teacher': raise PermissionDenied"""
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=form_master_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': []
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 403
        assert 'Only teachers can record attendance' in str(response.data)
    
    def test_teacher_not_assigned_to_class_blocked(self, api_client, teacher_user, classroom, subject):
        """Branch: if not TeachingAssignment.objects.filter(...).exists()"""
        
        # No TeachingAssignment created for this teacher/class/subject
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': []
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 403
        assert 'not assigned' in str(response.data).lower()
    
    def test_duplicate_session_blocked(self, api_client, teacher_user, classroom, subject):
        """Branch: if AttendanceSession.objects.filter(...).exists()"""
        
        # Create teaching assignment
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        # Create existing session
        AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': []
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 400
    
    def test_valid_session_creation_calls_risk_update(self, api_client, teacher_user, classroom, subject, mocker):
        """Branch: session = serializer.save(); update_risk_after_session(session)"""
        
        # Create teaching assignment
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        # Create enrolled student
        student = Student.objects.create(
            admission_number='TEST001',
            full_name='Test Student',
            gender='male'
        )
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        
        # Mock risk service
        mock_risk = mocker.patch('attendance.views.update_risk_after_session')
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': [
                {
                    'student': student.student_id,
                    'status': 'present',
                    'remarks': ''
                }
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201
        assert mock_risk.called
        assert mock_risk.call_count == 1
    
    def test_valid_session_different_date_allowed(self, api_client, teacher_user, classroom, subject):
        """Different date should allow new session"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        # Create session for yesterday
        AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date(2024, 1, 15)
        )
        
        student = Student.objects.create(
            admission_number='TEST002',
            full_name='Test Student',
            gender='male'
        )
        StudentEnrollment.objects.create(
            student=student,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),  # Different date
            'records': [
                {
                    'student': student.student_id,
                    'status': 'present',
                    'remarks': ''
                }
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201


@pytest.mark.attendance
class TestAttendanceSessionDetailView:
    """Test AttendanceSessionDetailView access"""
    
    def test_authenticated_user_can_retrieve_session(self, api_client, teacher_user, classroom, subject):
        """Basic retrieve functionality"""
        
        session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        url = f'/api/attendance/sessions/{session.session_id}/'
        api_client.force_authenticate(user=teacher_user)
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['session_id'] == session.session_id
    
    def test_unauthenticated_user_blocked(self, api_client, teacher_user, classroom, subject):
        """Unauthenticated access blocked"""
        
        session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        url = f'/api/attendance/sessions/{session.session_id}/'
        # No authentication
        
        response = api_client.get(url)
        assert response.status_code == 401
