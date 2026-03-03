"""
Script to reset Form Master password for testing
Run: python reset_form_master_password.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Find form master
form_masters = User.objects.filter(role='form_master')

if not form_masters.exists():
    print("No form master found!")
else:
    for fm in form_masters:
        # Reset password to Test@1234
        fm.set_password('Test@1234')
        fm.save()
        print(f"Password reset for {fm.email} (Form Master)")
        print(f"   Email: {fm.email}")
        print(f"   Password: Test@1234")
        print(f"   Role: {fm.role}")
        print(f"   Active: {fm.is_active}")
        
        # Test authentication
        from django.contrib.auth import authenticate
        test_auth = authenticate(username=fm.email, password='Test@1234')
        print(f"   Authentication test: {'SUCCESS' if test_auth else 'FAILED'}")
