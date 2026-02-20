from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Subject, TeachingAssignment
from .serializers import SubjectSerializer, TeachingAssignmentSerializer


# -----------------------
# SUBJECTS
# -----------------------

class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can create subjects.")
        serializer.save()


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can update subjects.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can delete subjects.")
        instance.delete()


# -----------------------
# TEACHING ASSIGNMENTS
# -----------------------

class TeachingAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = TeachingAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "teacher":
            return TeachingAssignment.objects.filter(teacher=user, is_active=True)

        return TeachingAssignment.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can create teaching assignments.")
        serializer.save()


class TeachingAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeachingAssignment.objects.all()
    serializer_class = TeachingAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can update assignments.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admins can delete assignments.")
        instance.delete()
