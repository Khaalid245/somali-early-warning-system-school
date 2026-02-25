from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from django.conf import settings
from django.urls import path
from ..tokens import MyTokenObtainPairSerializer
from rest_framework import status


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Check if user has 2FA enabled
            from django.contrib.auth import get_user_model
            User = get_user_model()
            email = request.data.get('email')
            
            try:
                user = User.objects.get(email=email)
                if user.two_factor_enabled:
                    # Don't set cookies yet, require 2FA verification
                    return Response({
                        'requires_2fa': True,
                        'email': email,
                        'message': 'Please enter your 2FA code'
                    }, status=status.HTTP_202_ACCEPTED)
            except User.DoesNotExist:
                pass
            
            # Set tokens in httpOnly cookies
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            if access_token:
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    max_age=3600  # 1 hour
                )
            
            if refresh_token:
                response.set_cookie(
                    key='refresh_token',
                    value=refresh_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    max_age=604800  # 7 days
                )
        
        return response


class MyTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            request.data._mutable = True
            request.data['refresh'] = refresh_token
            request.data._mutable = False
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            if access_token:
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    max_age=3600
                )
            response.data = {'message': 'Token refreshed'}
        
        return response


urlpatterns = [
    path("login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", MyTokenRefreshView.as_view(), name="token_refresh"),
]
