from django.urls import path
from .views import (
    InterventionListCreateView,
    InterventionDetailView,
    InterventionsByUserView,
    InterventionsBySessionView
)

urlpatterns = [
    path('', InterventionListCreateView.as_view(), name='intervention-list-create'),
    path('<int:pk>/', InterventionDetailView.as_view(), name='intervention-detail'),
    path('assigned/<int:user_id>/', InterventionsByUserView.as_view(), name='interventions-by-user'),
    path('session/<int:session_id>/', InterventionsBySessionView.as_view(), name='interventions-by-session'),
]
