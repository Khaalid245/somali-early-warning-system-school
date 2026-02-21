from django.urls import path
from .views import (
    InterventionCaseListCreateView,
    InterventionCaseDetailView,
    InterventionsByAlertView,
)
from .dashboard_view import FormMasterDashboardView
from .meeting_views import (
    InterventionMeetingListCreateView,
    InterventionMeetingDetailView,
    ProgressUpdateCreateView,
    StudentInterventionHistoryView,
    RecurringAbsenceDetectionView,
    InterventionDashboardStatsView,
)

urlpatterns = [
    # Existing intervention cases
    path("", InterventionCaseListCreateView.as_view(), name="intervention-list-create"),
    path("dashboard/", FormMasterDashboardView.as_view(), name="form-master-dashboard"),
    path("cases/<int:pk>/", InterventionCaseDetailView.as_view(), name="intervention-detail"),
    path("alert/<int:alert_id>/", InterventionsByAlertView.as_view(), name="interventions-by-alert"),
    
    # New intervention meetings
    path("meetings/", InterventionMeetingListCreateView.as_view(), name="meeting-list-create"),
    path("meetings/<int:pk>/", InterventionMeetingDetailView.as_view(), name="meeting-detail"),
    path("meetings/progress/", ProgressUpdateCreateView.as_view(), name="progress-create"),
    path("meetings/student/<int:student_id>/", StudentInterventionHistoryView.as_view(), name="student-history"),
    path("meetings/recurring/", RecurringAbsenceDetectionView.as_view(), name="recurring-absences"),
    path("meetings/stats/", InterventionDashboardStatsView.as_view(), name="meeting-stats"),
]
