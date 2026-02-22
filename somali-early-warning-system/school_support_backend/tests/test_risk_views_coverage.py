"""
Test Coverage for risk/views.py
Target: Increase coverage from 56% to 75%+
Focus: Uncovered branches only
"""
import pytest
from decimal import Decimal
from risk.models import StudentRiskProfile, SubjectRiskInsight


@pytest.mark.django_db
class TestStudentRiskViews:
    """API tests for StudentRiskListView and StudentRiskDetailView"""
    
    def test_unauthenticated_access_returns_401(self, api_client):
        """Branch: No authentication"""
        response = api_client.get('/api/risk/students/')
        assert response.status_code == 401
    
    def test_nonexistent_student_returns_404(self, authenticated_teacher):
        """Branch: Student risk profile does not exist"""
        response = authenticated_teacher.get('/api/risk/students/99999/')
        assert response.status_code == 404
    
    def test_valid_student_no_risk_history(self, authenticated_teacher, student):
        """Branch: Valid student with no risk profile"""
        response = authenticated_teacher.get('/api/risk/students/')
        assert response.status_code == 200
        assert response.data['count'] == 0
    
    def test_valid_student_with_risk_history(self, authenticated_teacher, student):
        """Branch: Valid student with risk profile"""
        StudentRiskProfile.objects.create(
            student=student,
            risk_score=Decimal("75.50"),
            risk_level="high"
        )
        
        response = authenticated_teacher.get('/api/risk/students/')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['risk_level'] == 'high'
        assert float(response.data['results'][0]['risk_score']) == 75.50
    
    def test_filter_by_student_id(self, authenticated_teacher, student):
        """Branch: if student_id"""
        from students.models import Student
        
        student2 = Student.objects.create(
            admission_number="STU999",
            full_name="Other Student",
            gender="male",
            status="active",
            is_active=True
        )
        
        StudentRiskProfile.objects.create(student=student, risk_score=Decimal("50.00"), risk_level="medium")
        StudentRiskProfile.objects.create(student=student2, risk_score=Decimal("80.00"), risk_level="high")
        
        response = authenticated_teacher.get(f'/api/risk/students/?student={student.student_id}')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['student'] == student.student_id
    
    def test_filter_by_risk_level(self, authenticated_teacher, student):
        """Branch: if risk_level"""
        from students.models import Student
        
        student2 = Student.objects.create(
            admission_number="STU888",
            full_name="Another Student",
            gender="female",
            status="active",
            is_active=True
        )
        
        StudentRiskProfile.objects.create(student=student, risk_score=Decimal("30.00"), risk_level="low")
        StudentRiskProfile.objects.create(student=student2, risk_score=Decimal("90.00"), risk_level="critical")
        
        response = authenticated_teacher.get('/api/risk/students/?level=critical')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['risk_level'] == 'critical'
    
    def test_retrieve_specific_risk_profile(self, authenticated_teacher, student):
        """Branch: StudentRiskDetailView retrieve"""
        profile = StudentRiskProfile.objects.create(
            student=student,
            risk_score=Decimal("65.00"),
            risk_level="medium"
        )
        
        response = authenticated_teacher.get(f'/api/risk/students/{profile.pk}/')
        assert response.status_code == 200
        assert response.data['risk_level'] == 'medium'
        assert float(response.data['risk_score']) == 65.00


@pytest.mark.django_db
class TestSubjectRiskInsightViews:
    """API tests for SubjectRiskInsightListView and SubjectRiskInsightDetailView"""
    
    def test_unauthenticated_access_returns_401(self, api_client):
        """Branch: No authentication"""
        response = api_client.get('/api/risk/subjects/')
        assert response.status_code == 401
    
    def test_nonexistent_insight_returns_404(self, authenticated_teacher):
        """Branch: Subject risk insight does not exist"""
        response = authenticated_teacher.get('/api/risk/subjects/99999/')
        assert response.status_code == 404
    
    def test_list_with_no_insights(self, authenticated_teacher):
        """Branch: Empty queryset"""
        response = authenticated_teacher.get('/api/risk/subjects/')
        assert response.status_code == 200
        assert response.data['count'] == 0
    
    def test_list_with_insights(self, authenticated_teacher, student, subject):
        """Branch: Queryset with data"""
        SubjectRiskInsight.objects.create(
            student=student,
            subject=subject,
            total_sessions=20,
            absence_count=5,
            late_count=2,
            absence_rate=Decimal("25.00")
        )
        
        response = authenticated_teacher.get('/api/risk/subjects/')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['total_sessions'] == 20
        assert response.data['results'][0]['absence_count'] == 5
    
    def test_filter_by_student_id(self, authenticated_teacher, student, subject):
        """Branch: if student_id"""
        from students.models import Student
        
        student2 = Student.objects.create(
            admission_number="STU777",
            full_name="Test Student",
            gender="male",
            status="active",
            is_active=True
        )
        
        SubjectRiskInsight.objects.create(
            student=student,
            subject=subject,
            total_sessions=10,
            absence_count=2,
            absence_rate=Decimal("20.00")
        )
        SubjectRiskInsight.objects.create(
            student=student2,
            subject=subject,
            total_sessions=15,
            absence_count=8,
            absence_rate=Decimal("53.33")
        )
        
        response = authenticated_teacher.get(f'/api/risk/subjects/?student={student.student_id}')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['student'] == student.student_id
    
    def test_filter_by_subject_id(self, authenticated_teacher, student, subject):
        """Branch: if subject_id"""
        from academics.models import Subject
        
        subject2 = Subject.objects.create(name="History", code="HIS101")
        
        SubjectRiskInsight.objects.create(
            student=student,
            subject=subject,
            total_sessions=10,
            absence_count=1,
            absence_rate=Decimal("10.00")
        )
        SubjectRiskInsight.objects.create(
            student=student,
            subject=subject2,
            total_sessions=12,
            absence_count=6,
            absence_rate=Decimal("50.00")
        )
        
        response = authenticated_teacher.get(f'/api/risk/subjects/?subject={subject2.subject_id}')
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['subject'] == subject2.subject_id
    
    def test_retrieve_specific_insight(self, authenticated_teacher, student, subject):
        """Branch: SubjectRiskInsightDetailView retrieve"""
        insight = SubjectRiskInsight.objects.create(
            student=student,
            subject=subject,
            total_sessions=25,
            absence_count=10,
            late_count=3,
            absence_rate=Decimal("40.00")
        )
        
        response = authenticated_teacher.get(f'/api/risk/subjects/{insight.pk}/')
        assert response.status_code == 200
        assert response.data['total_sessions'] == 25
        assert response.data['absence_count'] == 10
        assert float(response.data['absence_rate']) == 40.00
    
    def test_admin_access(self, authenticated_admin, student, subject):
        """Branch: Admin role access"""
        SubjectRiskInsight.objects.create(
            student=student,
            subject=subject,
            total_sessions=30,
            absence_count=3,
            absence_rate=Decimal("10.00")
        )
        
        response = authenticated_admin.get('/api/risk/subjects/')
        assert response.status_code == 200
        assert response.data['count'] == 1
    
    def test_form_master_access(self, authenticated_form_master, student, subject):
        """Branch: Form master role access"""
        SubjectRiskInsight.objects.create(
            student=student,
            subject=subject,
            total_sessions=18,
            absence_count=4,
            absence_rate=Decimal("22.22")
        )
        
        response = authenticated_form_master.get('/api/risk/subjects/')
        assert response.status_code == 200
        assert response.data['count'] == 1
