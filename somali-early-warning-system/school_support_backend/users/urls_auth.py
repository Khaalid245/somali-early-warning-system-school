from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views.auth import MyTokenObtainPairView   # ✅ fixed import

urlpatterns = [
    path("login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
