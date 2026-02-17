from django.urls import path
from .views import (
    StudentListCreateView,
    StudentDetailView,
    ClassroomListCreateView,
    ClassroomDetailView,
    EnrollmentListCreateView,
    EnrollmentDetailView,
)

urlpatterns = [
    # Students
    path("", StudentListCreateView.as_view(), name="student-list-create"),
    path("<int:pk>/", StudentDetailView.as_view(), name="student-detail"),

    # Classrooms
    path("classrooms/", ClassroomListCreateView.as_view(), name="classroom-list-create"),
    path("classrooms/<int:pk>/", ClassroomDetailView.as_view(), name="classroom-detail"),

    # Enrollments
    path("enrollments/", EnrollmentListCreateView.as_view(), name="enrollment-list-create"),
    path("enrollments/<int:pk>/", EnrollmentDetailView.as_view(), name="enrollment-detail"),
]
