from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views.auth import MyTokenObtainPairView
from .views.logout import LogoutView
from .views.users import ChangePasswordView
from .views.two_factor import Setup2FAView, Enable2FAView, Disable2FAView, Verify2FAView, ForceReset2FAView

urlpatterns = [
    path("login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("2fa/setup/", Setup2FAView.as_view(), name="2fa_setup"),
    path("2fa/enable/", Enable2FAView.as_view(), name="2fa_enable"),
    path("2fa/disable/", Disable2FAView.as_view(), name="2fa_disable"),
    path("2fa/verify/", Verify2FAView.as_view(), name="2fa_verify"),
    path("2fa/force-reset/", ForceReset2FAView.as_view(), name="2fa_force_reset"),
]
