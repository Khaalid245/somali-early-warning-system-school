import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from alerts.models import Alert
from academics.models import TeachingAssignment
from users.models import User

# Get teacher user
teacher = User.objects.filter(email='jibriil@gmail.com').first()
print(f'=== TEACHER: {teacher.email} ===')

# Get teacher's subjects
teaching_assignments = TeachingAssignment.objects.filter(teacher=teacher, is_active=True)
teacher_subjects = [assignment.subject.subject_id for assignment in teaching_assignments]
print(f'\nTeacher Subjects: {teacher_subjects}')

# Get all active alerts
print(f'\n=== ALL ACTIVE ALERTS ===')
all_alerts = Alert.objects.filter(status__in=['active', 'under_review', 'escalated'])
for alert in all_alerts:
    print(f'Alert #{alert.alert_id}: {alert.student.full_name} - Subject: {alert.subject} - Risk: {alert.risk_level}')

# Check if alerts have subjects
print(f'\n=== ALERTS FILTERED BY TEACHER SUBJECTS ===')
teacher_alerts = Alert.objects.filter(
    subject_id__in=teacher_subjects,
    status__in=['active', 'under_review', 'escalated']
)
print(f'Count: {teacher_alerts.count()}')
for alert in teacher_alerts:
    print(f'Alert #{alert.alert_id}: {alert.student.full_name} - Subject: {alert.subject.name} - Risk: {alert.risk_level}')
