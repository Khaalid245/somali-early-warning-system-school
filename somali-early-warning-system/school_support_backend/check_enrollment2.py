import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from students.models import Classroom, StudentEnrollment

for c in Classroom.objects.all():
    print(f"Classroom: {c.name}  academic_year='{c.academic_year}'  type={type(c.academic_year)}")
    enrollments = StudentEnrollment.objects.filter(classroom=c, is_active=True)
    print(f"  Enrollments (is_active=True): {enrollments.count()}")
    for e in enrollments:
        print(f"    student_id={e.student_id}  academic_year='{e.academic_year}'  type={type(e.academic_year)}")

    # Simulate what the serializer does
    filtered = StudentEnrollment.objects.filter(
        classroom=c,
        academic_year=c.academic_year,
        is_active=True
    ).values_list("student_id", flat=True)
    print(f"  Filtered by classroom.academic_year='{c.academic_year}': {list(filtered)}")
    print()
