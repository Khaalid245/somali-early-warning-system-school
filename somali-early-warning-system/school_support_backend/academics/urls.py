from django.urls import path
from .views import (
    SubjectListCreateView,
    SubjectDetailView,
    TeachingAssignmentListCreateView,
    TeachingAssignmentDetailView,
)

urlpatterns = [

    # Subjects
    path("subjects/", SubjectListCreateView.as_view(), name="subject-list-create"),
    path("subjects/<int:pk>/", SubjectDetailView.as_view(), name="subject-detail"),

    # Teaching Assignments
    path("assignments/", TeachingAssignmentListCreateView.as_view(), name="assignment-list-create"),
    path("assignments/<int:pk>/", TeachingAssignmentDetailView.as_view(), name="assignment-detail"),
]
