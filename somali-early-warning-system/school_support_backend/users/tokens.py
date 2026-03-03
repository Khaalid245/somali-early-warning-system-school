from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom fields inside the JWT token payload
        token["user_id"] = user.id
        token["role"] = user.role
        token["name"] = user.name
        token["email"] = user.email
        token["username"] = user.name

        return token

    def validate(self, attrs):
        # Map email to username for authentication
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Authenticate using email
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            
            if not user:
                from rest_framework_simplejwt.exceptions import AuthenticationFailed
                raise AuthenticationFailed('No active account found with the given credentials')
            
            # Set user for token generation
            self.user = user
            
            # Generate tokens
            refresh = self.get_token(user)
            
            data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'role': user.role,
                'name': user.name,
                'email': user.email,
            }
            
            return data
        else:
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed('Must include "email" and "password".')
