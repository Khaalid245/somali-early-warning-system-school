from django.urls import path
from .views import (
    InterventionCaseListCreateView,
    InterventionCaseDetailView,
    InterventionsByAlertView,
)

urlpatterns = [
    path("", InterventionCaseListCreateView.as_view(), name="intervention-list-create"),
    path("<int:pk>/", InterventionCaseDetailView.as_view(), name="intervention-detail"),
    path("alert/<int:alert_id>/", InterventionsByAlertView.as_view(), name="interventions-by-alert"),
]
