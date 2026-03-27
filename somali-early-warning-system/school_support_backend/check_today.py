import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from datetime import date
from academics.schedule_models import SchoolTimetable

today = date.today()
day_name = today.strftime('%A').lower()  # backend uses full lowercase name

print(f"Today's date : {today}")
print(f"Today's day  : {day_name}")
print()

entries = SchoolTimetable.objects.filter(day_of_week=day_name, is_active=True).select_related('classroom','subject','teacher').order_by('classroom__name','period')

if not entries:
    print(f"NO timetable entries found for '{day_name}'")
    print()
    print("All days that have entries:")
    from django.db.models import Count
    days = SchoolTimetable.objects.filter(is_active=True).values('day_of_week').annotate(n=Count('timetable_id')).order_by('day_of_week')
    for d in days:
        print(f"  {d['day_of_week']}: {d['n']} entries")
else:
    print(f"Found {entries.count()} entries for '{day_name}':")
    for e in entries:
        print(f"  Period {e.period} | {e.classroom.name} | {e.subject.name} | {e.teacher.name}")
