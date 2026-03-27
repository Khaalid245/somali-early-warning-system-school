import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from datetime import date
from academics.schedule_models import SchoolTimetable
from users.models import User

today = date.today()
day_name = today.strftime('%A').lower()
print(f"Today: {today} ({day_name})")
print()

hodan = User.objects.filter(name__icontains='hodan').first()
if not hodan:
    print("No user found with name 'hodan'")
else:
    print(f"Teacher: {hodan.name} (id={hodan.id})")
    print()
    entries = SchoolTimetable.objects.filter(
        teacher=hodan, day_of_week=day_name, is_active=True
    ).select_related('classroom', 'subject').order_by('period')

    if not entries:
        print(f"No timetable entries for Hodan on {day_name}")
    else:
        print(f"Hodan's schedule today ({day_name}):")
        for e in entries:
            print(f"  Period {e.period} | {e.classroom.name} | {e.subject.name}")
