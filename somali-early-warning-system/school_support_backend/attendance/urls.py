from django.urls import path
from .views import (
    AttendanceSessionListCreateView,
    AttendanceSessionDetailView,
)
from .daily_monitor_view import DailyAttendanceMonitorView
from .student_report_view import StudentAttendanceReportView
from .tracking_views import (
    StudentAttendanceTrackingView,
    ClassStudentsAttendanceView,
    StudentAttendanceHistoryView
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
    path(
        "tracking/classes/",
        StudentAttendanceTrackingView.as_view(),
        name="attendance-tracking-classes"
    ),
    path(
        "tracking/class/<int:class_id>/students/",
        ClassStudentsAttendanceView.as_view(),
        name="attendance-tracking-students"
    ),
    path(
        "tracking/student/<int:student_id>/history/",
        StudentAttendanceHistoryView.as_view(),
        name="attendance-tracking-history"
    ),
]
