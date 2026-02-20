"""
Quick script to assign classes to a teacher
Run: python manage.py shell < assign_classes.py
"""

from users.models import User
from students.models import Classroom
from academics.models import Subject, TeachingAssignment

# Get teacher (update email if needed)
teacher_email = "teacher@example.com"  # Change this to your teacher's email
teacher = User.objects.filter(email=teacher_email, role='teacher').first()

if not teacher:
    print(f"❌ Teacher with email {teacher_email} not found!")
    print("Available teachers:")
    for t in User.objects.filter(role='teacher'):
        print(f"  - {t.email} (ID: {t.user_id})")
else:
    print(f"✓ Found teacher: {teacher.get_full_name()} ({teacher.email})")
    
    # Get or create classroom
    classroom, created = Classroom.objects.get_or_create(
        name="Grade 10A",
        defaults={'grade_level': 10}
    )
    print(f"✓ Classroom: {classroom.name}")
    
    # Get or create subjects
    math, _ = Subject.objects.get_or_create(
        name="Mathematics",
        defaults={'code': 'MATH101'}
    )
    english, _ = Subject.objects.get_or_create(
        name="English",
        defaults={'code': 'ENG101'}
    )
    
    # Create assignments
    assignment1, created1 = TeachingAssignment.objects.get_or_create(
        teacher=teacher,
        classroom=classroom,
        subject=math,
        defaults={'is_active': True}
    )
    print(f"{'✓ Created' if created1 else '✓ Already exists'}: {classroom.name} - {math.name}")
    
    assignment2, created2 = TeachingAssignment.objects.get_or_create(
        teacher=teacher,
        classroom=classroom,
        subject=english,
        defaults={'is_active': True}
    )
    print(f"{'✓ Created' if created2 else '✓ Already exists'}: {classroom.name} - {english.name}")
    
    print("\n✅ Done! Teacher now has classes assigned.")
    print(f"Total assignments: {TeachingAssignment.objects.filter(teacher=teacher).count()}")
