from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Student, Classroom, StudentEnrollment
from .serializers import StudentSerializer, ClassroomSerializer, StudentEnrollmentSerializer
from academics.models import Classroom as AcademicClassroom


class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.filter(is_active=True)
        
        # Admin sees all students
        if user.role == 'admin':
            classroom_id = self.request.query_params.get('classroom')
            if classroom_id:
                queryset = queryset.filter(enrollments__classroom_id=classroom_id, enrollments__is_active=True)
            return queryset
        
        # Form Master sees only their classroom students
        if user.role == 'form_master':
            my_classrooms = AcademicClassroom.objects.filter(form_master=user).values_list('class_id', flat=True)
            queryset = queryset.filter(
                enrollments__classroom_id__in=my_classrooms,
                enrollments__is_active=True
            ).distinct()
            return queryset
        
        # Teacher sees students from their assigned classes
        if user.role == 'teacher':
            from academics.models import TeachingAssignment
            my_classrooms = TeachingAssignment.objects.filter(
                teacher=user,
                is_active=True
            ).values_list('classroom_id', flat=True)
            queryset = queryset.filter(
                enrollments__classroom_id__in=my_classrooms,
                enrollments__is_active=True
            ).distinct()
            return queryset
        
        # Default: no access
        return Student.objects.none()
    
    def perform_create(self, serializer):
        # Only admin can create students
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only administrators can create students.")
        serializer.save()


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]


class ClassroomListCreateView(generics.ListCreateAPIView):
    queryset = Classroom.objects.all().select_related('form_master')
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]


class EnrollmentListCreateView(generics.ListCreateAPIView):
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]
