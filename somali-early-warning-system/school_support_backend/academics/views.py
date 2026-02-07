from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Subject, TeachingAssignment
from .serializers import SubjectSerializer, TeachingAssignmentSerializer


# -----------------------
# Admin Only Mixin
# -----------------------
class AdminOnlyMixin:
    def dispatch(self, request, *args, **kwargs):
        # This runs AFTER authentication because of inheritance order
        if request.user.role != "admin":
            raise PermissionDenied("Only admins can perform this action.")
        return super().dispatch(request, *args, **kwargs)


# -----------------------
# Subjects (Admin only)
# -----------------------
class SubjectListCreateView(generics.ListCreateAPIView, AdminOnlyMixin):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]


# -----------------------
# Teaching Assignments (Admin only)
# -----------------------
class TeachingAssignmentListCreateView(generics.ListCreateAPIView, AdminOnlyMixin):
    queryset = TeachingAssignment.objects.all()
    serializer_class = TeachingAssignmentSerializer
    permission_classes = [IsAuthenticated]


class TeachingAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView, AdminOnlyMixin):
    queryset = TeachingAssignment.objects.all()
    serializer_class = TeachingAssignmentSerializer
    permission_classes = [IsAuthenticated]
