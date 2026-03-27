import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from datetime import date
from academics.schedule_models import SchoolTimetable
from users.models import User

print("=== All Teachers ===")
for u in User.objects.filter(role='teacher').order_by('name'):
    print(f"  id={u.id}  name='{u.name}'  email={u.email}")

today = date.today()
day_name = today.strftime('%A').lower()
print(f"\n=== Today's Full Schedule ({day_name}) ===")
entries = SchoolTimetable.objects.filter(
    day_of_week=day_name, is_active=True
).select_related('classroom', 'subject', 'teacher').order_by('teacher__name', 'period')
for e in entries:
    print(f"  {e.teacher.name:20s} | Period {e.period} | {e.classroom.name} | {e.subject.name}")
