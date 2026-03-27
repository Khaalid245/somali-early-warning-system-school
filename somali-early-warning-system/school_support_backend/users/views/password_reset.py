import secrets
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import User, PasswordResetToken


class PasswordResetRequestView(APIView):
    permission_classes = []  # Public — no auth needed

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=400)

        # Always return success — never reveal if email exists (security)
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            return Response({'message': 'If that email exists, a reset link has been sent.'})

        # Invalidate any existing tokens for this user
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)

        # Create new token (expires in 1 hour)
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=1)
        )

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?token={token}"
        school_name = getattr(settings, 'SCHOOL_NAME', 'School Early Warning System')

        send_mail(
            subject=f'Password Reset — {school_name}',
            message=f"""Dear {user.name},

You requested a password reset for your {school_name} account.

Click the link below to set a new password (valid for 1 hour):
{reset_link}

If you did not request this, ignore this email — your password will not change.

{school_name}""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({'message': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = []  # Public — no auth needed

    def post(self, request):
        token_str = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')

        if not token_str or not new_password:
            return Response({'error': 'Token and new password are required.'}, status=400)

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(
                token=token_str,
                used=False,
                expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'This reset link is invalid or has expired.'}, status=400)

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.used = True
        reset_token.save()

        # Audit log
        try:
            from dashboard.models import AuditLog
            AuditLog.objects.create(
                user=user,
                action='password_reset',
                description=f'{user.name} reset their password via email link',
                metadata={'user_id': user.id}
            )
        except Exception:
            pass

        return Response({'message': 'Password reset successfully. You can now log in.'})
