from django.urls import path
from .views import (
    AttendanceSessionListCreateView,
    AttendanceSessionDetailView,
)

urlpatterns = [
    path(
        "sessions/",
        AttendanceSessionListCreateView.as_view(),
        name="attendance-session-list-create"
    ),
    path(
        "sessions/<int:pk>/",
        AttendanceSessionDetailView.as_view(),
        name="attendance-session-detail"
    ),
]
