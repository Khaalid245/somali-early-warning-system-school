from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse
from core.throttling import SensitiveEndpointThrottle
import qrcode
import io
import base64

class Setup2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SensitiveEndpointThrottle]
    
    def post(self, request):
        """Generate 2FA secret and return QR code"""
        user = request.user
        
        # Generate secret
        secret = user.generate_2fa_secret()
        uri = user.get_2fa_uri()
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{img_str}',
            'uri': uri
        })


class Enable2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SensitiveEndpointThrottle]
    
    def post(self, request):
        """Enable 2FA after verifying code"""
        user = request.user
        code = request.data.get('code')
        
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.two_factor_secret:
            return Response({'error': '2FA not set up'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.verify_2fa_code(code):
            user.two_factor_enabled = True
            user.save()
            return Response({'message': '2FA enabled successfully'})
        else:
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)


class Disable2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SensitiveEndpointThrottle]
    
    def post(self, request):
        """Disable 2FA after verifying code"""
        user = request.user
        code = request.data.get('code')
        
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.verify_2fa_code(code):
            user.two_factor_enabled = False
            user.two_factor_secret = None
            user.save()
            return Response({'message': '2FA disabled successfully'})
        else:
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)


class Verify2FAView(APIView):
    """Verify 2FA code during login"""
    
    def post(self, request):
        from django.contrib.auth import get_user_model
        from ..tokens import MyTokenObtainPairSerializer
        User = get_user_model()
        
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            if user.verify_2fa_code(code):
                # Generate JWT tokens with custom claims
                token = MyTokenObtainPairSerializer.get_token(user)
                return Response({
                    'valid': True,
                    'access': str(token.access_token),
                    'refresh': str(token),
                    'user_id': user.id,
                    'role': user.role,
                    'name': user.name,
                    'email': user.email
                })
            else:
                return Response({'valid': False, 'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class ForceReset2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [SensitiveEndpointThrottle]
    
    def post(self, request):
        """Reset 2FA using password verification"""
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(password):
            return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.save()
        return Response({'message': '2FA reset successfully'})
