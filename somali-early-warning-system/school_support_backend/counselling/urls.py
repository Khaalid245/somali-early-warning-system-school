from django.urls import path
from .views import CounsellingSessionListCreateView, CounsellingSessionDetailView

urlpatterns = [
    path('', CounsellingSessionListCreateView.as_view(), name='counselling-list-create'),
    path('<int:pk>/', CounsellingSessionDetailView.as_view(), name='counselling-detail'),
]
