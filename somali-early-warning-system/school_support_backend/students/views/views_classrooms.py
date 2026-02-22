from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from students.models import Classroom
from students.serializers import ClassroomSerializer


class ClassroomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Classroom.objects.all()

        # Admin → all classrooms
        if user.role == "admin":
            return queryset

        # Form master → only their classroom
        if user.role == "form_master":
            return queryset.filter(form_master=user)

        # Teacher → only classrooms they teach
        if user.role == "teacher":
            return queryset.filter(
                teaching_assignments__teacher=user
            ).distinct()

        return Classroom.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can create classrooms.")
        serializer.save()


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """IDOR Protection: Filter by user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return Classroom.objects.all()
        
        if user.role == 'form_master':
            return Classroom.objects.filter(form_master=user)
        
        if user.role == 'teacher':
            return Classroom.objects.filter(
                teaching_assignments__teacher=user
            ).distinct()
        
        return Classroom.objects.none()

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can update classrooms.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can delete classrooms.")
        instance.delete()
