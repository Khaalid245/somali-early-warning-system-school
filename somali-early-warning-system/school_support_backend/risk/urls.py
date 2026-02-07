from django.urls import path
from .views import RiskProfileListView, RiskProfileDetailView

urlpatterns = [
    path('', RiskProfileListView.as_view(), name='risk-list'),
    path('<int:pk>/', RiskProfileDetailView.as_view(), name='risk-detail'),
]
