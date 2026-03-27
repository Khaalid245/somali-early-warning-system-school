import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from students.models import Classroom
from users.models import User
from academics.timetable_generator import generate_timetable_for_classroom

print("=== Classrooms ===")
for c in Classroom.objects.all():
    print(f"  class_id={c.class_id} name={c.name}")

admin = User.objects.filter(role='admin').first()
print(f"\nAdmin: {admin}")

print("\n=== Generate classroom 1 ===")
r1 = generate_timetable_for_classroom(1, admin, '2024-2025', 'Term 1')
print(r1)

print("\n=== Generate classroom 2 ===")
r2 = generate_timetable_for_classroom(2, admin, '2024-2025', 'Term 1')
print(r2)
