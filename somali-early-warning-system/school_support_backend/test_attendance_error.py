"""
Test script to reproduce attendance submission error
"""
from django.utils import timezone
from datetime import date
from attendance.models import AttendanceSession, AttendanceRecord
from students.models import Student, Classroom
from academics.models import Subject
from users.models import User

# Get test user
teacher = User.objects.filter(email__icontains='test').first()
print(f"Teacher: {teacher.email}")

# Get classrooms and subject
classroom_3a = Classroom.objects.filter(name='3A').first()
classroom_3b = Classroom.objects.filter(name='3B').first()
subject = Subject.objects.filter(name='History').first()

print(f"\nClassroom 3A: {classroom_3a.name if classroom_3a else 'NOT FOUND'}")
print(f"Classroom 3B: {classroom_3b.name if classroom_3b else 'NOT FOUND'}")
print(f"Subject: {subject.name if subject else 'NOT FOUND'}")

# Check existing sessions
today = date(2026, 3, 18)
existing = AttendanceSession.objects.filter(
    teacher=teacher,
    attendance_date=today
)
print(f"\nExisting sessions for {teacher.email} on {today}:")
for s in existing:
    print(f"  - {s.classroom.name} | {s.subject.name} | Period {s.period}")

# Try to create session for 3A Period 5
print(f"\n--- Attempting to create: 3A | History | Period 5 ---")
try:
    session = AttendanceSession.objects.create(
        classroom=classroom_3a,
        subject=subject,
        teacher=teacher,
        attendance_date=today,
        period='5'
    )
    print(f"✅ SUCCESS! Session ID: {session.session_id}")
    
    # Try to add a student record
    student = Student.objects.filter(classroom=classroom_3a).first()
    if student:
        record = AttendanceRecord.objects.create(
            session=session,
            student=student,
            status='present'
        )
        print(f"✅ Added student record for {student.full_name}")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
