"""
Surgical Test for students/serializers.py line 97
Target: get_classroom method when no active enrollment
"""
import pytest


@pytest.mark.django_db
class TestStudentSerializerClassroom:
    """Target line 97: get_classroom when no active enrollment"""
    
    def test_get_classroom_no_active_enrollment(self, student):
        """Line 97: Return 'Not Enrolled' when no active enrollment"""
        from students.serializers import StudentSerializer
        
        # Student has no active enrollments by default
        serializer = StudentSerializer(instance=student)
        
        # This triggers line 97: return 'Not Enrolled'
        classroom = serializer.get_classroom(student)
        assert classroom == 'Not Enrolled'