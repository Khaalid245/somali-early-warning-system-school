from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Student, Classroom, StudentEnrollment
from .serializers import StudentSerializer, ClassroomSerializer, StudentEnrollmentSerializer


class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Student.objects.all()
        classroom_id = self.request.query_params.get('classroom')
        if classroom_id:
            queryset = queryset.filter(enrollments__classroom_id=classroom_id, enrollments__is_active=True)
        return queryset


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
