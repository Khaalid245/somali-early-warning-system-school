from django.urls import path
from .views import (
    StudentRiskListView,
    StudentRiskDetailView,
    SubjectRiskInsightListView,
    SubjectRiskInsightDetailView,
)

urlpatterns = [
    # Overall student risk
    path("students/", StudentRiskListView.as_view(), name="student-risk-list"),
    path("students/<int:pk>/", StudentRiskDetailView.as_view(), name="student-risk-detail"),

    # Subject analytics
    path("subjects/", SubjectRiskInsightListView.as_view(), name="subject-risk-list"),
    path("subjects/<int:pk>/", SubjectRiskInsightDetailView.as_view(), name="subject-risk-detail"),
]
