"""
Test Coverage for attendance/serializers.py
Targets: AttendanceSessionSerializer.validate() and create() methods
Coverage Goal: 95%+ branch coverage
"""
import pytest
from datetime import date
from rest_framework.exceptions import PermissionDenied, ValidationError
from attendance.serializers import AttendanceSessionSerializer
from academics.models import TeachingAssignment
from students.models import Student, StudentEnrollment


@pytest.mark.serializers
class TestAttendanceSessionSerializerValidate:
    """Test validate() method branches"""
    
    def test_non_teacher_validation_error(self, api_client, form_master_user, classroom, subject):
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
    
    def test_teacher_not_assigned_validation_error(self, api_client, teacher_user, classroom, subject):
        """Branch: if not TeachingAssignment.objects.filter(...).exists()"""
        
        # No TeachingAssignment created
        
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
        assert 'not assigned to this class and subject' in str(response.data)
    
    def test_duplicate_students_validation_error(self, api_client, teacher_user, classroom, subject):
        """Branch: if len(submitted_ids) != len(submitted_set)"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        student = Student.objects.create(
            admission_number='STU001',
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
            'attendance_date': str(date.today()),
            'records': [
                {'student': student.student_id, 'status': 'present', 'remarks': ''},
                {'student': student.student_id, 'status': 'absent', 'remarks': ''}  # Duplicate
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 400
        assert 'Duplicate students detected' in str(response.data)
    
    def test_missing_students_validation_error(self, api_client, teacher_user, classroom, subject):
        """Branch: if submitted_set != enrolled_set (missing students)"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        student1 = Student.objects.create(
            admission_number='STU101',
            full_name='Student One',
            gender='male'
        )
        student2 = Student.objects.create(
            admission_number='STU102',
            full_name='Student Two',
            gender='female'
        )
        
        StudentEnrollment.objects.create(
            student=student1,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        StudentEnrollment.objects.create(
            student=student2,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': [
                {'student': student1.student_id, 'status': 'present', 'remarks': ''}
                # Missing student2
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 400
        assert 'must be submitted for ALL enrolled students' in str(response.data)
    
    def test_extra_students_validation_error(self, api_client, teacher_user, classroom, subject):
        """Branch: if submitted_set != enrolled_set (extra students)"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        enrolled_student = Student.objects.create(
            admission_number='STU201',
            full_name='Enrolled Student',
            gender='male'
        )
        not_enrolled_student = Student.objects.create(
            admission_number='STU202',
            full_name='Not Enrolled',
            gender='female'
        )
        
        StudentEnrollment.objects.create(
            student=enrolled_student,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        # not_enrolled_student has no enrollment
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': [
                {'student': enrolled_student.student_id, 'status': 'present', 'remarks': ''},
                {'student': not_enrolled_student.student_id, 'status': 'present', 'remarks': ''}  # Extra
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 400
        assert 'must be submitted for ALL enrolled students' in str(response.data)
    
    def test_inactive_enrollment_excluded(self, api_client, teacher_user, classroom, subject):
        """Branch: is_active=True filter in enrollment query"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        active_student = Student.objects.create(
            admission_number='STU301',
            full_name='Active Student',
            gender='male'
        )
        inactive_student = Student.objects.create(
            admission_number='STU302',
            full_name='Inactive Student',
            gender='female'
        )
        
        StudentEnrollment.objects.create(
            student=active_student,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        StudentEnrollment.objects.create(
            student=inactive_student,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=False  # Inactive
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        # Should only need active_student
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': [
                {'student': active_student.student_id, 'status': 'present', 'remarks': ''}
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201


@pytest.mark.serializers
class TestAttendanceSessionSerializerCreate:
    """Test create() method branches"""
    
    def test_valid_data_creates_session_and_records(self, api_client, teacher_user, classroom, subject):
        """Branch: session = AttendanceSession.objects.create(...); AttendanceRecord.objects.create(...)"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        student1 = Student.objects.create(
            admission_number='STU401',
            full_name='Student One',
            gender='male'
        )
        student2 = Student.objects.create(
            admission_number='STU402',
            full_name='Student Two',
            gender='female'
        )
        
        StudentEnrollment.objects.create(
            student=student1,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        StudentEnrollment.objects.create(
            student=student2,
            classroom=classroom,
            academic_year=classroom.academic_year,
            is_active=True
        )
        
        url = '/api/attendance/sessions/'
        api_client.force_authenticate(user=teacher_user)
        
        data = {
            'classroom': classroom.class_id,
            'subject': subject.subject_id,
            'attendance_date': str(date.today()),
            'records': [
                {'student': student1.student_id, 'status': 'present', 'remarks': 'On time'},
                {'student': student2.student_id, 'status': 'absent', 'remarks': 'Sick'}
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201
        
        # Verify session created
        assert 'session_id' in response.data
        session_id = response.data['session_id']
        
        # Verify records created
        from attendance.models import AttendanceSession, AttendanceRecord
        session = AttendanceSession.objects.get(session_id=session_id)
        assert session.teacher == teacher_user
        assert session.classroom == classroom
        assert session.subject == subject
        
        records = AttendanceRecord.objects.filter(session=session)
        assert records.count() == 2
        
        record1 = records.get(student=student1)
        assert record1.status == 'present'
        assert record1.remarks == 'On time'
        
        record2 = records.get(student=student2)
        assert record2.status == 'absent'
        assert record2.remarks == 'Sick'
    
    def test_teacher_auto_assigned_from_request(self, api_client, teacher_user, classroom, subject):
        """Branch: validated_data['teacher'] = teacher (from request.user)"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        student = Student.objects.create(
            admission_number='STU501',
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
            'attendance_date': str(date.today()),
            'records': [
                {'student': student.student_id, 'status': 'present', 'remarks': ''}
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201
        
        from attendance.models import AttendanceSession
        session = AttendanceSession.objects.get(session_id=response.data['session_id'])
        assert session.teacher == teacher_user  # Auto-assigned
    
    def test_remarks_optional_defaults_to_empty(self, api_client, teacher_user, classroom, subject):
        """Branch: remarks=record_data.get('remarks', '')"""
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject
        )
        
        student = Student.objects.create(
            admission_number='STU601',
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
            'attendance_date': str(date.today()),
            'records': [
                {'student': student.student_id, 'status': 'present'}  # No remarks
            ]
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == 201
        
        from attendance.models import AttendanceRecord
        record = AttendanceRecord.objects.get(session__session_id=response.data['session_id'])
        assert record.remarks == ''  # Default empty string
