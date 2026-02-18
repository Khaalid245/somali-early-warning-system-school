from django.urls import path
from .views import AlertListCreateView, AlertDetailView


urlpatterns = [
    # List + Create alerts
    path('', AlertListCreateView.as_view(), name='alert-list-create'),

    # Retrieve + Update specific alert
    path('<int:pk>/', AlertDetailView.as_view(), name='alert-detail'),
]
