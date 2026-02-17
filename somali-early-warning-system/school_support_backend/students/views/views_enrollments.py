from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from students.models import StudentEnrollment
from students.serializers import StudentEnrollmentSerializer


# -----------------------------------
# ENROLLMENT LIST + CREATE
# -----------------------------------
class EnrollmentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = StudentEnrollment.objects.select_related(
            "student",
            "classroom"
        )

        # Admin → sees all
        if user.role == "admin":
            return queryset

        # Form master → only their classrooms
        if user.role == "form_master":
            return queryset.filter(
                classroom__form_master=user
            )

        # Teacher → only classes they teach
        if user.role == "teacher":
            return queryset.filter(
                classroom__teachingassignment__teacher=user
            ).distinct()

        return StudentEnrollment.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can create enrollments.")
        serializer.save()


# -----------------------------------
# ENROLLMENT DETAIL / UPDATE / DELETE
# -----------------------------------
class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = StudentEnrollment.objects.select_related(
            "student",
            "classroom"
        )

        # Admin → full access
        if user.role == "admin":
            return queryset

        # Form master → only their classrooms
        if user.role == "form_master":
            return queryset.filter(
                classroom__form_master=user
            )

        # Teacher → only classes they teach
        if user.role == "teacher":
            return queryset.filter(
                classroom__teachingassignment__teacher=user
            ).distinct()

        return StudentEnrollment.objects.none()

    def perform_update(self, serializer):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can update enrollments.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != "admin":
            raise PermissionDenied("Only admin can delete enrollments.")
        instance.delete()
