import os, sys, django, traceback
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from academics.models import TeachingAssignment
from students.models import StudentEnrollment, Classroom
from django.utils import timezone
from django.test import RequestFactory

User = get_user_model()

teacher = User.objects.filter(role='teacher').first()
print(f"Teacher: pk={teacher.pk} name={teacher.name}")

assignment = TeachingAssignment.objects.filter(teacher=teacher).select_related('subject', 'classroom').first()
c = assignment.classroom
s = assignment.subject
print(f"Classroom: pk={c.class_id} name={c.name} academic_year={c.academic_year}")
print(f"Subject: pk={s.pk} name={s.name}")

enrolled = list(StudentEnrollment.objects.filter(
    classroom=c,
    academic_year=c.academic_year,
    is_active=True
).values_list('student_id', flat=True))
print(f"Enrolled student IDs: {enrolled}")

if not enrolled:
    print("ERROR: No enrolled students — check academic_year match")
    all_enroll = list(StudentEnrollment.objects.filter(classroom=c).values('student_id', 'academic_year', 'is_active'))
    print(f"All enrollments for classroom: {all_enroll}")
    sys.exit(1)

records = [{'student': sid, 'status': 'present', 'remarks': ''} for sid in enrolled]
data = {
    'classroom': c.class_id,
    'subject': s.pk,
    'attendance_date': str(timezone.now().date()),
    'period': '1',
    'records': records,
}
print(f"\nPayload: {data}")

factory = RequestFactory()
req = factory.post('/')
req.user = teacher

from attendance.serializers import AttendanceSessionSerializer
ser = AttendanceSessionSerializer(data=data, context={'request': req})
valid = ser.is_valid()
print(f"\nSerializer valid: {valid}")
if ser.errors:
    print(f"Errors: {ser.errors}")
else:
    print("Validation passed — trying save...")
    try:
        session = ser.save(teacher=teacher)
        print(f"Session created: pk={session.pk}")
        from risk.services import update_risk_after_session
        update_risk_after_session(session)
        print("Risk update OK")
        session.delete()
        print("Cleaned up")
    except Exception as e:
        print(f"SAVE/RISK ERROR: {e}")
        traceback.print_exc()
