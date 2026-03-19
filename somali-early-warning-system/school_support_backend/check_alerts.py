import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from alerts.models import Alert
from students.models import Student
from attendance.models import AttendanceRecord
from django.db.models import Count

print('=== ALERT STATISTICS ===')
print(f'Total Alerts: {Alert.objects.count()}')
print(f'Active Alerts: {Alert.objects.filter(status__in=["active", "under_review", "escalated"]).count()}')

print('\n=== STUDENTS WITH 3+ ABSENCES ===')
students_with_absences = AttendanceRecord.objects.filter(
    status='absent'
).values('student__full_name', 'student_id').annotate(
    absence_count=Count('record_id')
).filter(absence_count__gte=3).order_by('-absence_count')

for s in students_with_absences[:10]:
    print(f'{s["student__full_name"]}: {s["absence_count"]} absences')

print(f'\n=== ALERTS FOR THESE STUDENTS ===')
for s in students_with_absences[:10]:
    alerts = Alert.objects.filter(
        student_id=s['student_id'], 
        status__in=['active', 'under_review', 'escalated']
    )
    print(f'{s["student__full_name"]}: {alerts.count()} active alerts')
