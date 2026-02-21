from django.urls import path
from .views import DashboardView
from .admin_view_safe import AdminDashboardViewSafe
from .test_view import AdminTestView
from .admin_actions import (
    reassign_case,
    update_alert_status,
    reassign_alert,
    archive_alert,
    attendance_drill_down,
    audit_logs,
    export_cases_report,
    export_risk_summary,
    export_performance_metrics
)
from .user_management import (
    list_users,
    create_user,
    update_user,
    disable_user,
    enable_user,
    list_classrooms,
    create_classroom,
    update_classroom,
    enroll_student,
    list_enrollments,
    assign_teacher,
    list_assignments
)

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
    path("admin/", AdminDashboardViewSafe.as_view(), name="admin_dashboard"),
    path("admin/test/", AdminTestView.as_view(), name="admin_test"),
    
    # Admin Actions
    path("admin/cases/<int:case_id>/reassign/", reassign_case, name="reassign_case"),
    path("admin/alerts/<int:alert_id>/status/", update_alert_status, name="update_alert_status"),
    path("admin/alerts/<int:alert_id>/reassign/", reassign_alert, name="reassign_alert"),
    path("admin/alerts/<int:alert_id>/archive/", archive_alert, name="archive_alert"),
    
    # Admin Analytics
    path("admin/attendance/drill-down/", attendance_drill_down, name="attendance_drill_down"),
    path("admin/audit-logs/", audit_logs, name="audit_logs"),
    
    # Admin Reports
    path("admin/export/cases/", export_cases_report, name="export_cases"),
    path("admin/export/risk-summary/", export_risk_summary, name="export_risk_summary"),
    path("admin/export/performance/", export_performance_metrics, name="export_performance"),
    
    # User Management
    path("admin/users/", list_users, name="list_users"),
    path("admin/users/create/", create_user, name="create_user"),
    path("admin/users/<int:user_id>/", update_user, name="update_user"),
    path("admin/users/<int:user_id>/disable/", disable_user, name="disable_user"),
    path("admin/users/<int:user_id>/enable/", enable_user, name="enable_user"),
    
    # Classroom Management
    path("admin/classrooms/", list_classrooms, name="list_classrooms"),
    path("admin/classrooms/create/", create_classroom, name="create_classroom"),
    path("admin/classrooms/<int:class_id>/", update_classroom, name="update_classroom"),
    
    # Enrollment Management
    path("admin/enrollments/", list_enrollments, name="list_enrollments"),
    path("admin/enrollments/create/", enroll_student, name="enroll_student"),
    
    # Teacher Assignment
    path("admin/assignments/", list_assignments, name="list_assignments"),
    path("admin/assignments/create/", assign_teacher, name="assign_teacher"),
]
