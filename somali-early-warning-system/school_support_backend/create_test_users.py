"""
Quick script to create test users for the School Early Warning System
Run with: python manage.py shell < create_test_users.py
"""

from users.models import User

print("\n" + "="*60)
print("CREATING TEST USERS")
print("="*60 + "\n")

# Test user credentials
test_users = [
    {
        'email': 'admin@school.edu',
        'password': 'Admin@123',
        'name': 'System Administrator',
        'role': 'admin',
        'is_staff': True,
    },
    {
        'email': 'teacher@school.edu',
        'password': 'Teacher@123',
        'name': 'John Teacher',
        'role': 'teacher',
    },
    {
        'email': 'formmaster@school.edu',
        'password': 'FormMaster@123',
        'name': 'Jane FormMaster',
        'role': 'form_master',
    },
]

created_count = 0
skipped_count = 0

for user_data in test_users:
    email = user_data['email']
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        print(f"⏭️  SKIPPED: {email} (already exists)")
        skipped_count += 1
        continue
    
    # Create user
    password = user_data.pop('password')
    user = User.objects.create_user(password=password, **user_data)
    user.is_active = True
    user.save()
    
    print(f"✅ CREATED: {email}")
    print(f"   Name: {user.name}")
    print(f"   Role: {user.role}")
    print(f"   Password: {password}")
    print("-" * 60)
    created_count += 1

print(f"\n📊 Summary:")
print(f"   Created: {created_count}")
print(f"   Skipped: {skipped_count}")
print(f"   Total users in DB: {User.objects.count()}")

if created_count > 0:
    print("\n✅ Test users created successfully!")
    print("\nYou can now login with:")
    print("\n🔐 Admin Account:")
    print("   Email: admin@school.edu")
    print("   Password: Admin@123")
    print("\n👨‍🏫 Teacher Account:")
    print("   Email: teacher@school.edu")
    print("   Password: Teacher@123")
    print("\n👔 Form Master Account:")
    print("   Email: formmaster@school.edu")
    print("   Password: FormMaster@123")

print("\n" + "="*60 + "\n")
