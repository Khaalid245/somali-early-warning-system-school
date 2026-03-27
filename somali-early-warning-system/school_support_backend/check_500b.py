import os, django, traceback
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from students.models import Classroom, StudentEnrollment
from academics.models import Subject
from users.models import User
from attendance.serializers import AttendanceSessionSerializer
from rest_framework.test import APIRequestFactory
from datetime import date

teacher = User.objects.get(email='hodon@gmail.com')
classroom = Classroom.objects.get(name='3B')
subject = Subject.objects.filter(name__icontains='science').first()

# Get enrolled students
students = StudentEnrollment.objects.filter(
    classroom=classroom, academic_year=classroom.academic_year, is_active=True
).values_list('student_id', flat=True)

print(f"Teacher: {teacher.name}")
print(f"Classroom: {classroom.name}")
print(f"Subject: {subject.name}")
print(f"Students: {list(students)}")
print()

records = [{'student': sid, 'status': 'present', 'remarks': ''} for sid in students]

factory = APIRequestFactory()
request = factory.post('/attendance/sessions/')
request.user = teacher

data = {
    'classroom': classroom.class_id,
    'subject': subject.subject_id,
    'period': '1',
    'attendance_date': date.today().isoformat(),
    'records': records
}

print("Submitting data:", data)
print()

serializer = AttendanceSessionSerializer(data=data, context={'request': request})
if serializer.is_valid():
    print("Serializer valid — attempting save...")
    try:
        session = serializer.save()
        print(f"SUCCESS: session_id={session.session_id}")
    except Exception as e:
        print("SAVE ERROR:")
        traceback.print_exc()
else:
    print("VALIDATION ERRORS:")
    print(serializer.errors)
