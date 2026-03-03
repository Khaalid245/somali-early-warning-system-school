"""
Test Data Encryption
Verifies that sensitive fields are encrypted in the database
Run: python manage.py shell < test_encryption.py
"""
from students.models import Student
from users.models import User
from django.db import connection

print("\n" + "="*60)
print("DATA ENCRYPTION TEST")
print("="*60)

# Test 1: Check if data is encrypted in database
print("\n1. Checking raw database values (should be encrypted)...")
with connection.cursor() as cursor:
    # Check students table
    cursor.execute("SELECT student_id, full_name FROM students_student LIMIT 1")
    row = cursor.fetchone()
    if row:
        print(f"   Raw student name in DB: {row[1][:50]}...")
        print(f"   ✓ Encrypted: {not row[1].isalpha()}")
    
    # Check users table
    cursor.execute("SELECT id, name, email FROM users_user LIMIT 1")
    row = cursor.fetchone()
    if row:
        print(f"   Raw user name in DB: {row[1][:50]}...")
        print(f"   Raw user email in DB: {row[2][:50]}...")
        print(f"   ✓ Encrypted: {not row[1].isalpha()}")

# Test 2: Check if data is decrypted when accessed via Django ORM
print("\n2. Checking Django ORM values (should be decrypted)...")
student = Student.objects.first()
if student:
    print(f"   Student name via ORM: {student.full_name}")
    print(f"   ✓ Decrypted: {student.full_name.replace(' ', '').isalpha()}")

user = User.objects.first()
if user:
    print(f"   User name via ORM: {user.name}")
    print(f"   User email via ORM: {user.email}")
    print(f"   ✓ Decrypted: {user.name.replace(' ', '').isalpha()}")

print("\n" + "="*60)
print("ENCRYPTION TEST COMPLETED")
print("="*60 + "\n")
