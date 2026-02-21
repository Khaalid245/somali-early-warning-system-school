from django.urls import path
from .views import (
    AttendanceSessionListCreateView,
    AttendanceSessionDetailView,
)
from .daily_monitor_view import DailyAttendanceMonitorView
from .student_report_view import StudentAttendanceReportView

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
    path(
        "daily-monitor/",
        DailyAttendanceMonitorView.as_view(),
        name="daily-attendance-monitor"
    ),
    path(
        "student-report/<int:student_id>/",
        StudentAttendanceReportView.as_view(),
        name="student-attendance-report"
    ),
]
