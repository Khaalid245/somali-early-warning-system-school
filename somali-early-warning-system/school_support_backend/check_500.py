import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from attendance.models import AttendanceSession, AttendanceRecord
from academics.models import TeachingAssignment
from students.models import Classroom, Student
from users.models import User
from datetime import date

# Simulate what the view does
teacher = User.objects.get(email='hodon@gmail.com')
classroom = Classroom.objects.get(name='3B')
from academics.models import Subject
subject = Subject.objects.filter(name__icontains='science').first()

print(f"Teacher: {teacher.name}")
print(f"Classroom: {classroom.name}")
print(f"Subject: {subject.name if subject else 'NOT FOUND'}")
print()

# Check TeachingAssignment
assigned = TeachingAssignment.objects.filter(teacher=teacher, subject=subject, classroom=classroom).exists()
print(f"TeachingAssignment exists: {assigned}")
print()

# Check AttendanceSession fields
print("AttendanceSession fields:")
for f in AttendanceSession._meta.get_fields():
    print(f"  {f.name}")
print()

# Check AttendanceRecord fields
print("AttendanceRecord fields:")
for f in AttendanceRecord._meta.get_fields():
    print(f"  {f.name}")
print()

# Check students in classroom
students = Student.objects.filter(classroom=classroom)
print(f"Students in {classroom.name}: {students.count()}")
for s in students:
    print(f"  id={s.student_id} name={s.full_name}")
