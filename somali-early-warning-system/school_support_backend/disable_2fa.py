"""
Script to disable 2FA for a user
Run: python manage.py shell < disable_2fa.py
"""
from users.models import User

email = 'xasan@gmail.com'

try:
    user = User.objects.get(email=email)
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.save()
    print(f"✅ 2FA disabled for {email}")
    print(f"You can now login without 2FA code")
except User.DoesNotExist:
    print(f"❌ User {email} not found")
