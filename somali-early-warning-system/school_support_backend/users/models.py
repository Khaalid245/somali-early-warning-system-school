from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager
import pyotp
import base64


class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('teacher', 'Teacher'),
        ('form_master', 'Form Master'),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    biography = models.TextField(blank=True, null=True, max_length=500)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 2FA Fields
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "role"]

    objects = UserManager()

    def __str__(self):
        return f"{self.name} ({self.role})"

    def generate_2fa_secret(self):
        """Generate a new 2FA secret"""
        self.two_factor_secret = pyotp.random_base32()
        self.save()
        return self.two_factor_secret

    def get_2fa_uri(self):
        """Get provisioning URI for QR code"""
        if not self.two_factor_secret:
            self.generate_2fa_secret()
        totp = pyotp.TOTP(self.two_factor_secret)
        return totp.provisioning_uri(name=self.email, issuer_name='School Support System')

    def verify_2fa_code(self, code):
        """Verify 2FA code"""
        if not self.two_factor_secret:
            return False
        totp = pyotp.TOTP(self.two_factor_secret)
        return totp.verify(code, valid_window=1)
