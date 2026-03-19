from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from users.permissions import IsAdminUserRole
from core.throttling import SensitiveEndpointThrottle, FileUploadThrottle

from ..models import User
from ..serializers import UserSerializer, UserUpdateSerializer, ChangePasswordSerializer


class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    throttle_classes = [SensitiveEndpointThrottle]  # Rate limit user creation

    def get_queryset(self):
        return User.objects.all()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    throttle_classes = [FileUploadThrottle]  # Rate limit profile updates

    def get_queryset(self):
        return User.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id != request.user.id and not request.user.is_staff:
            return Response(
                {"detail": "You can only update your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SensitiveEndpointThrottle]  # Rate limit password changes

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            # Handle password validation errors
            if 'new_password' in serializer.errors:
                # Join all password validation errors into a single message
                password_errors = serializer.errors['new_password']
                if isinstance(password_errors, list):
                    error_message = '. '.join(password_errors)
                else:
                    error_message = str(password_errors)
                return Response(
                    {"error": error_message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Log the password change for security audit
        from dashboard.models import AuditLog
        try:
            AuditLog.objects.create(
                user=user,
                action='password_changed',
                description=f'User {user.name} changed their password',
                metadata={'user_id': user.id, 'changed_by': 'self'}
            )
        except Exception:
            pass  # Don't fail password change if audit log fails
        
        return Response(
            {"message": "Password changed successfully"},
            status=status.HTTP_200_OK
        )
