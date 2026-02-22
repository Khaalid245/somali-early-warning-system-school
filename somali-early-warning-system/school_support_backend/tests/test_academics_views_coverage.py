"""
Academics Views Coverage Tests
Target: 55% → 75%
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestSubjectListCreateView:
    
    def test_list_subjects(self, authenticated_teacher, subject):
        """Happy path: List subjects"""
        response = authenticated_teacher.get('/api/academics/subjects/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_can_create(self, authenticated_admin):
        """Happy path: Admin can create subject"""
        response = authenticated_admin.post('/api/academics/subjects/', {
            'name': 'Physics',
            'code': 'PHY101'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_teacher_cannot_create(self, authenticated_teacher):
        """Permission: Teacher cannot create subject"""
        response = authenticated_teacher.post('/api/academics/subjects/', {
            'name': 'Physics',
            'code': 'PHY101'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestSubjectDetailView:
    
    def test_retrieve_subject(self, authenticated_teacher, subject):
        """Happy path: Retrieve subject"""
        response = authenticated_teacher.get(f'/api/academics/subjects/{subject.subject_id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_can_update(self, authenticated_admin, subject):
        """Happy path: Admin can update subject"""
        response = authenticated_admin.patch(f'/api/academics/subjects/{subject.subject_id}/', {
            'name': 'Updated Math'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
    
    def test_teacher_cannot_update(self, authenticated_teacher, subject):
        """Permission: Teacher cannot update subject"""
        response = authenticated_teacher.patch(f'/api/academics/subjects/{subject.subject_id}/', {
            'name': 'Updated'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_can_delete(self, authenticated_admin, subject):
        """Happy path: Admin can delete subject"""
        response = authenticated_admin.delete(f'/api/academics/subjects/{subject.subject_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_teacher_cannot_delete(self, authenticated_teacher, subject):
        """Permission: Teacher cannot delete subject"""
        response = authenticated_teacher.delete(f'/api/academics/subjects/{subject.subject_id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestTeachingAssignmentListCreateView:
    
    def test_teacher_sees_own_assignments(self, authenticated_teacher, teaching_assignment):
        """Branch: Teacher sees only own assignments"""
        response = authenticated_teacher.get('/api/academics/assignments/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_sees_all_assignments(self, authenticated_admin, teaching_assignment):
        """Branch: Admin sees all assignments"""
        response = authenticated_admin.get('/api/academics/assignments/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_can_create(self, authenticated_admin, teacher_user, classroom, subject):
        """Happy path: Admin can create assignment"""
        response = authenticated_admin.post('/api/academics/assignments/', {
            'teacher': teacher_user.id,
            'classroom': classroom.class_id,
            'subject': subject.subject_id
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_teacher_cannot_create(self, authenticated_teacher, teacher_user, classroom, subject):
        """Permission: Teacher cannot create assignment"""
        response = authenticated_teacher.post('/api/academics/assignments/', {
            'teacher': teacher_user.id,
            'classroom': classroom.class_id,
            'subject': subject.subject_id
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestTeachingAssignmentDetailView:
    
    def test_retrieve_assignment(self, authenticated_teacher, teaching_assignment):
        """Happy path: Retrieve assignment"""
        response = authenticated_teacher.get(f'/api/academics/assignments/{teaching_assignment.assignment_id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_can_update(self, authenticated_admin, teaching_assignment):
        """Happy path: Admin can update assignment"""
        response = authenticated_admin.patch(f'/api/academics/assignments/{teaching_assignment.assignment_id}/', {
            'is_active': False
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
    
    def test_teacher_cannot_update(self, authenticated_teacher, teaching_assignment):
        """Permission: Teacher cannot update assignment"""
        response = authenticated_teacher.patch(f'/api/academics/assignments/{teaching_assignment.assignment_id}/', {
            'is_active': False
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_can_delete(self, authenticated_admin, teaching_assignment):
        """Happy path: Admin can delete assignment"""
        response = authenticated_admin.delete(f'/api/academics/assignments/{teaching_assignment.assignment_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_teacher_cannot_delete(self, authenticated_teacher, teaching_assignment):
        """Permission: Teacher cannot delete assignment"""
        response = authenticated_teacher.delete(f'/api/academics/assignments/{teaching_assignment.assignment_id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
