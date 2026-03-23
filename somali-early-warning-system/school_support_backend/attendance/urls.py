from django.urls import path, include
from .views import (
    AttendanceSessionListCreateView,
    AttendanceSessionDetailView,
    StudentAbsenceDetailsView,
)
from .daily_monitor_view import DailyAttendanceMonitorView
from .student_report_view import StudentAttendanceReportView
from .tracking_views import (
    StudentAttendanceTrackingView,
    ClassStudentsAttendanceView,
    StudentAttendanceHistoryView
)
from .cross_subject_view import CrossSubjectPatternView

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
    path(
        "absence-details/",
        StudentAbsenceDetailsView.as_view(),
        name="student-absence-details"
    ),
    path(
        "cross-subject-pattern/<int:student_id>/",
        CrossSubjectPatternView.as_view(),
        name="cross-subject-pattern"
    ),
]
