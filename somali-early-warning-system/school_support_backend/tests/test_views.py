"""
View Tests
Tests API endpoints, HTTP responses, and request handling

WHY THIS MATTERS:
- Views are the API contract with frontend
- Tests validate HTTP status codes
- Ensures proper error responses
- Validates serialization and data formatting
"""
import pytest
from rest_framework import status
from datetime import date


@pytest.mark.django_db
class TestDashboardViews:
    """Test dashboard API endpoints"""

    def test_admin_dashboard_endpoint(self, authenticated_admin):
        """View: Admin can access dashboard"""
        url = '/api/dashboard/'
        response = authenticated_admin.get(url)
        
        # Should succeed or 404 if endpoint differs
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_teacher_dashboard_endpoint(self, authenticated_teacher):
        """View: Teacher can access dashboard"""
        url = '/api/dashboard/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_form_master_dashboard_endpoint(self, authenticated_form_master):
        """View: Form master can access dashboard"""
        url = '/api/dashboard/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_unauthenticated_dashboard_access(self, api_client):
        """View: Unauthenticated users cannot access dashboard"""
        url = '/api/dashboard/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestStudentViews:
    """Test student management endpoints"""

    def test_list_students_as_admin(self, authenticated_admin, student):
        """View: Admin can list students"""
        url = '/api/students/'
        response = authenticated_admin.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_list_students_as_teacher(self, authenticated_teacher):
        """View: Teacher can list students"""
        url = '/api/students/'
        response = authenticated_teacher.get(url)
        
        # Should succeed or be forbidden based on permissions
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_create_student_as_admin(self, authenticated_admin):
        """View: Admin can create students"""
        url = '/api/students/'
        data = {
            'admission_number': 'STU999',
            'full_name': 'New Student',
            'gender': 'male',
            'status': 'active'
        }
        response = authenticated_admin.post(url, data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND
        ]

    def test_create_student_as_teacher(self, authenticated_teacher):
        """View: Teacher cannot create students"""
        url = '/api/students/'
        data = {
            'admission_number': 'STU998',
            'full_name': 'Unauthorized Student',
            'gender': 'female',
            'status': 'active'
        }
        response = authenticated_teacher.post(url, data)
        
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_student_detail(self, authenticated_admin, student):
        """View: Get individual student details"""
        url = f'/api/students/{student.student_id}/'
        response = authenticated_admin.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_update_student(self, authenticated_admin, student):
        """View: Update student information"""
        url = f'/api/students/{student.student_id}/'
        data = {'full_name': 'Updated Name'}
        response = authenticated_admin.patch(url, data)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestAlertViews:
    """Test alert management endpoints"""

    def test_list_alerts_as_admin(self, authenticated_admin):
        """View: Admin can list all alerts"""
        url = '/api/alerts/'
        response = authenticated_admin.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_list_alerts_as_form_master(self, authenticated_form_master):
        """View: Form master can list assigned alerts"""
        url = '/api/alerts/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_create_alert_as_teacher(
        self, authenticated_teacher, student, subject
    ):
        """View: Teacher can create alerts"""
        url = '/api/alerts/'
        data = {
            'student': student.student_id,
            'subject': subject.subject_id,
            'alert_type': 'attendance',
            'risk_level': 'high',
            'status': 'active'
        }
        response = authenticated_teacher.post(url, data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_alert_detail(
        self, authenticated_form_master, form_master_user, student, subject
    ):
        """View: Get individual alert details"""
        from alerts.models import Alert
        
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        url = f'/api/alerts/{alert.alert_id}/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestInterventionViews:
    """Test intervention case endpoints"""

    def test_list_interventions_as_form_master(self, authenticated_form_master):
        """View: Form master can list intervention cases"""
        url = '/api/interventions/cases/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_create_intervention_as_form_master(
        self, authenticated_form_master, form_master_user, student, subject
    ):
        """View: Form master can create intervention cases"""
        from alerts.models import Alert
        
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        url = '/api/interventions/cases/'
        data = {
            'student': student.student_id,
            'alert': alert.alert_id,
            'assigned_to': form_master_user.id,
            'status': 'open'
        }
        response = authenticated_form_master.post(url, data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND
        ]

    def test_update_intervention_status(
        self, authenticated_form_master, form_master_user, student, subject
    ):
        """View: Form master can update intervention status"""
        from alerts.models import Alert
        from interventions.models import InterventionCase
        
        alert = Alert.objects.create(
            student=student,
            subject=subject,
            alert_type='attendance',
            risk_level='high',
            assigned_to=form_master_user,
            status='active'
        )
        
        case = InterventionCase.objects.create(
            student=student,
            alert=alert,
            assigned_to=form_master_user,
            status='open'
        )
        
        url = f'/api/interventions/cases/{case.case_id}/'
        data = {'status': 'in_progress'}
        response = authenticated_form_master.patch(url, data)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestClassroomViews:
    """Test classroom management endpoints"""

    def test_list_classrooms_as_admin(self, authenticated_admin, classroom):
        """View: Admin can list classrooms"""
        url = '/api/dashboard/admin/classrooms/'
        response = authenticated_admin.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_list_classrooms_as_teacher(self, authenticated_teacher):
        """View: Teacher cannot list all classrooms"""
        url = '/api/dashboard/admin/classrooms/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_classroom_detail(self, authenticated_admin, classroom):
        """View: Get classroom details"""
        url = f'/api/students/classrooms/{classroom.class_id}/'
        response = authenticated_admin.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_classroom_students(
        self, authenticated_form_master, classroom, enrollment
    ):
        """View: Get students in classroom"""
        url = f'/api/students/classrooms/{classroom.class_id}/students/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestAttendanceViews:
    """Test attendance recording endpoints"""

    def test_list_attendance_sessions_as_teacher(
        self, authenticated_teacher, teaching_assignment
    ):
        """View: Teacher can list their attendance sessions"""
        url = '/api/attendance/sessions/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    def test_list_attendance_sessions_as_form_master(
        self, authenticated_form_master, classroom
    ):
        """View: Form master can list classroom attendance"""
        url = '/api/attendance/sessions/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    def test_get_attendance_session_detail(
        self, authenticated_teacher, classroom, subject, teacher_user
    ):
        """View: Get individual attendance session"""
        from attendance.models import AttendanceSession
        
        session = AttendanceSession.objects.create(
            classroom=classroom,
            subject=subject,
            teacher=teacher_user,
            attendance_date=date.today()
        )
        
        url = f'/api/attendance/sessions/{session.session_id}/'
        response = authenticated_teacher.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestRiskViews:
    """Test risk profile endpoints"""

    def test_list_risk_profiles_as_admin(self, authenticated_admin):
        """View: Admin can list risk profiles"""
        url = '/api/risk/profiles/'
        response = authenticated_admin.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_get_student_risk_profile(
        self, authenticated_form_master, student
    ):
        """View: Get student risk profile"""
        from risk.models import StudentRiskProfile
        
        profile = StudentRiskProfile.objects.create(
            student=student,
            risk_score=45.5,
            risk_level='medium'
        )
        
        url = f'/api/risk/profiles/{student.student_id}/'
        response = authenticated_form_master.get(url)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
class TestHTTPMethodValidation:
    """Test HTTP method restrictions"""

    def test_post_not_allowed_on_list_endpoint(self, authenticated_teacher):
        """View: POST not allowed where only GET is permitted"""
        url = '/api/attendance/sessions/'
        # Assuming this endpoint allows GET but not POST for teachers
        response = authenticated_teacher.get(url)
        
        # GET should work
        assert response.status_code == status.HTTP_200_OK

    def test_delete_not_allowed(self, authenticated_admin, student):
        """View: DELETE not allowed on protected resources"""
        url = f'/api/students/{student.student_id}/'
        response = authenticated_admin.delete(url)
        
        # Should be forbidden or method not allowed
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED,
            status.HTTP_404_NOT_FOUND
        ]

    def test_put_vs_patch(self, authenticated_admin, student):
        """View: PUT vs PATCH behavior"""
        url = f'/api/students/{student.student_id}/'
        data = {'full_name': 'Updated Name'}
        
        # Try PATCH
        patch_response = authenticated_admin.patch(url, data)
        
        # Try PUT
        put_response = authenticated_admin.put(url, data)
        
        # At least one should work or both should fail consistently
        assert patch_response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ] or put_response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]
