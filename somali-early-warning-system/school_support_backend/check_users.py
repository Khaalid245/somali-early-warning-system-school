"""
Diagnostic script to check user accounts in the database
Run with: python manage.py shell < check_users.py
"""

from users.models import User

print("\n" + "="*60)
print("USER ACCOUNT DIAGNOSTIC")
print("="*60 + "\n")

users = User.objects.all()

if not users.exists():
    print("❌ NO USERS FOUND IN DATABASE!")
    print("\nTo create a test user, run:")
    print("python manage.py createsuperuser")
    print("\nOr create users via the admin panel at:")
    print("http://127.0.0.1:8000/admin/")
else:
    print(f"✅ Found {users.count()} user(s) in database:\n")
    
    for user in users:
        print(f"📧 Email: {user.email}")
        print(f"   Name: {user.name}")
        print(f"   Role: {user.role}")
        print(f"   Active: {'✅' if user.is_active else '❌'}")
        print(f"   2FA Enabled: {'✅' if user.two_factor_enabled else '❌'}")
        print(f"   Has Password: {'✅' if user.password else '❌'}")
        print(f"   Staff: {'✅' if user.is_staff else '❌'}")
        print("-" * 60)

print("\n" + "="*60)
print("TESTING LOGIN CREDENTIALS")
print("="*60 + "\n")

# Test authentication
test_email = input("Enter email to test (or press Enter to skip): ").strip()
if test_email:
    test_password = input("Enter password to test: ").strip()
    
    from django.contrib.auth import authenticate
    user = authenticate(username=test_email, password=test_password)
    
    if user:
        print(f"\n✅ Authentication SUCCESSFUL for {test_email}")
        print(f"   User: {user.name} ({user.role})")
        if user.two_factor_enabled:
            print(f"   ⚠️  2FA is ENABLED - you'll need a 6-digit code to login")
    else:
        print(f"\n❌ Authentication FAILED for {test_email}")
        print("   Possible reasons:")
        print("   - Wrong password")
        print("   - User doesn't exist")
        print("   - Account is inactive")

print("\n" + "="*60)
