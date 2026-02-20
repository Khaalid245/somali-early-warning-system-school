from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from students.models import Student
from students.serializers import StudentSerializer


class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.all()
        
        classroom_id = self.request.query_params.get('classroom')
        if classroom_id:
            queryset = queryset.filter(enrollments__classroom_id=classroom_id, enrollments__is_active=True)
            return queryset

        # Admin → all students
        if user.role == "admin":
            return queryset

        # Form master → students in their classroom
        if user.role == "form_master":
            return queryset.filter(
                enrollments__classroom__form_master=user
            ).distinct()

        # Teacher → students in classes they teach
        if user.role == "teacher":
            return queryset.filter(
                enrollments__classroom__teaching_assignments__teacher=user
            ).distinct()

        return Student.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can create students.")
        serializer.save()


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.select_related("classroom")

        # Admin → full access
        if user.role == "admin":
            return queryset

        # Form master → only their classroom
        if user.role == "form_master":
            return queryset.filter(
                classroom__form_master=user
            )

        # Teacher → only their classes
        if user.role == "teacher":
            return queryset.filter(
                classroom__teachingassignment__teacher=user
            ).distinct()

        return Student.objects.none()

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can update students.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can delete students.")
        instance.delete()
