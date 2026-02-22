"""
Test Coverage for students/views/views_classrooms.py
Target: Increase coverage to at least 85%
"""
import pytest
from students.models import Classroom


@pytest.mark.django_db
class TestClassroomListCreateView:
    """API integration tests for ClassroomListCreateView"""
    
    def test_list_classrooms_unauthenticated(self, api_client):
        """Unauthorized user cannot list classrooms"""
        response = api_client.get('/api/students/classrooms/')
        assert response.status_code == 401
    
    def test_list_classrooms_admin(self, authenticated_admin, classroom, another_classroom):
        """Admin can see all classrooms"""
        response = authenticated_admin.get('/api/students/classrooms/')
        assert response.status_code == 200
        assert response.data['count'] >= 2
    
    def test_list_classrooms_form_master(self, authenticated_form_master, classroom):
        """Form master sees only their classroom"""
        response = authenticated_form_master.get('/api/students/classrooms/')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['class_id'] == classroom.class_id
    
    def test_list_classrooms_teacher(self, authenticated_teacher, classroom, teacher_user, subject):
        """Teacher sees only classrooms they teach"""
        from academics.models import TeachingAssignment
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject,
            is_active=True
        )
        
        response = authenticated_teacher.get('/api/students/classrooms/')
        assert response.status_code == 200
        assert response.data['count'] == 1
    
    def test_create_classroom_admin_valid(self, authenticated_admin, form_master_user):
        """Admin can create classroom with valid data"""
        data = {
            'name': 'Grade 11A',
            'academic_year': '2024',
            'form_master': form_master_user.id,
            'is_active': True
        }
        response = authenticated_admin.post('/api/students/classrooms/', data)
        assert response.status_code == 201
        assert response.data['name'] == 'Grade 11A'
    
    def test_create_classroom_invalid_payload(self, authenticated_admin):
        """Admin creating classroom with invalid data returns 400"""
        data = {'name': ''}  # Missing required fields
        response = authenticated_admin.post('/api/students/classrooms/', data)
        assert response.status_code == 400
    
    def test_create_classroom_duplicate_name(self, authenticated_admin, classroom):
        """Creating duplicate classroom returns 400"""
        data = {
            'name': classroom.name,
            'academic_year': classroom.academic_year,
            'is_active': True
        }
        response = authenticated_admin.post('/api/students/classrooms/', data)
        assert response.status_code == 400
    
    def test_create_classroom_teacher_forbidden(self, authenticated_teacher):
        """Teacher cannot create classroom"""
        data = {
            'name': 'Grade 12A',
            'academic_year': '2024',
            'is_active': True
        }
        response = authenticated_teacher.post('/api/students/classrooms/', data)
        assert response.status_code == 403
    
    def test_create_classroom_form_master_forbidden(self, authenticated_form_master):
        """Form master cannot create classroom"""
        data = {
            'name': 'Grade 12B',
            'academic_year': '2024',
            'is_active': True
        }
        response = authenticated_form_master.post('/api/students/classrooms/', data)
        assert response.status_code == 403


@pytest.mark.django_db
class TestClassroomDetailView:
    """API integration tests for ClassroomDetailView"""
    
    def test_retrieve_classroom_valid(self, authenticated_admin, classroom):
        """Admin can retrieve classroom detail"""
        response = authenticated_admin.get(f'/api/students/classrooms/{classroom.class_id}/')
        assert response.status_code == 200
        assert response.data['class_id'] == classroom.class_id
        assert response.data['name'] == classroom.name
    
    def test_retrieve_classroom_nonexistent(self, authenticated_admin):
        """Retrieving nonexistent classroom returns 404"""
        response = authenticated_admin.get('/api/students/classrooms/99999/')
        assert response.status_code == 404
    
    def test_retrieve_classroom_form_master_own(self, authenticated_form_master, classroom):
        """Form master can retrieve their own classroom"""
        response = authenticated_form_master.get(f'/api/students/classrooms/{classroom.class_id}/')
        assert response.status_code == 200
        assert response.data['class_id'] == classroom.class_id
    
    def test_retrieve_classroom_form_master_other(self, authenticated_form_master, another_classroom):
        """Form master cannot retrieve other classroom (IDOR protection)"""
        response = authenticated_form_master.get(f'/api/students/classrooms/{another_classroom.class_id}/')
        assert response.status_code == 404
    
    def test_retrieve_classroom_teacher_assigned(self, authenticated_teacher, classroom, teacher_user, subject):
        """Teacher can retrieve classroom they teach"""
        from academics.models import TeachingAssignment
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject,
            is_active=True
        )
        
        response = authenticated_teacher.get(f'/api/students/classrooms/{classroom.class_id}/')
        assert response.status_code == 200
    
    def test_update_classroom_admin_valid(self, authenticated_admin, classroom):
        """Admin can update classroom"""
        data = {'name': 'Grade 10A Updated', 'academic_year': '2024'}
        response = authenticated_admin.patch(f'/api/students/classrooms/{classroom.class_id}/', data)
        assert response.status_code == 200
        assert response.data['name'] == 'Grade 10A Updated'
    
    def test_update_classroom_invalid_data(self, authenticated_admin, classroom):
        """Admin updating with invalid data returns 400"""
        data = {'name': ''}  # Empty name
        response = authenticated_admin.patch(f'/api/students/classrooms/{classroom.class_id}/', data)
        assert response.status_code == 400
    
    def test_update_classroom_teacher_forbidden(self, authenticated_teacher, classroom, teacher_user, subject):
        """Teacher cannot update classroom"""
        from academics.models import TeachingAssignment
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject,
            is_active=True
        )
        
        data = {'name': 'Updated Name'}
        response = authenticated_teacher.patch(f'/api/students/classrooms/{classroom.class_id}/', data)
        assert response.status_code == 403
    
    def test_update_classroom_form_master_forbidden(self, authenticated_form_master, classroom):
        """Form master cannot update classroom"""
        data = {'name': 'Updated Name'}
        response = authenticated_form_master.patch(f'/api/students/classrooms/{classroom.class_id}/', data)
        assert response.status_code == 403
    
    def test_delete_classroom_admin(self, authenticated_admin):
        """Admin can delete classroom"""
        classroom = Classroom.objects.create(
            name='To Delete',
            academic_year='2024',
            is_active=True
        )
        response = authenticated_admin.delete(f'/api/students/classrooms/{classroom.class_id}/')
        assert response.status_code == 204
        assert not Classroom.objects.filter(class_id=classroom.class_id).exists()
    
    def test_delete_classroom_teacher_forbidden(self, authenticated_teacher, classroom, teacher_user, subject):
        """Teacher cannot delete classroom"""
        from academics.models import TeachingAssignment
        
        TeachingAssignment.objects.create(
            teacher=teacher_user,
            classroom=classroom,
            subject=subject,
            is_active=True
        )
        
        response = authenticated_teacher.delete(f'/api/students/classrooms/{classroom.class_id}/')
        assert response.status_code == 403
    
    def test_delete_classroom_form_master_forbidden(self, authenticated_form_master, classroom):
        """Form master cannot delete classroom"""
        response = authenticated_form_master.delete(f'/api/students/classrooms/{classroom.class_id}/')
        assert response.status_code == 403
