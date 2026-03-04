from django.urls import path
from .views import AlertListCreateView, AlertDetailView, AlertHistoryView


urlpatterns = [
    # List + Create alerts
    path('', AlertListCreateView.as_view(), name='alert-list-create'),

    # Alert history (resolved/dismissed)
    path('history/', AlertHistoryView.as_view(), name='alert-history'),

    # Retrieve + Update specific alert
    path('<int:pk>/', AlertDetailView.as_view(), name='alert-detail'),
]
