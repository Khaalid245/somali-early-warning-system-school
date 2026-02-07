from django.urls import path
from .views import SubjectListCreateView, TeachingAssignmentListCreateView

urlpatterns = [
    path("subjects/", SubjectListCreateView.as_view(), name="subject-list-create"),
    path("assignments/", TeachingAssignmentListCreateView.as_view(), name="teaching-assignment-list-create"),
]
