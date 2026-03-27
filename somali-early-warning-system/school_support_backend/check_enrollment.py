import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from students.models import Classroom, StudentEnrollment

print("Classroom fields:", [f.name for f in Classroom._meta.get_fields()])
print()
print("StudentEnrollment fields:", [f.name for f in StudentEnrollment._meta.get_fields()])
print()

# Check actual enrollments
c = Classroom.objects.get(name='3B')
enrollments = StudentEnrollment.objects.filter(classroom=c, is_active=True)
print(f"Active enrollments in 3B: {enrollments.count()}")
for e in enrollments:
    print(f"  student_id={e.student_id}  academic_year={e.academic_year}")
