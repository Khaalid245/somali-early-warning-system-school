from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that uses email instead of username
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # username parameter actually contains email
        email = username or kwargs.get('email')
        
        if email is None or password is None:
            return None
        
        try:
            # Normalize email (lowercase and strip)
            email = email.lower().strip()
            user = User.objects.get(email=email)
            
            # Check password and if user is active
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing attacks
            User().set_password(password)
            return None
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
