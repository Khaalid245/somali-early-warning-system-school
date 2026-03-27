import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from academics.schedule_models import SchoolTimetable
from django.db.models import Count

entries = list(SchoolTimetable.objects.select_related('classroom','subject','teacher').order_by('classroom__name','day_of_week','period'))
print('TOTAL ENTRIES:', len(entries))
print()

current_class = None
current_day = None
for e in entries:
    if e.classroom.name != current_class:
        current_class = e.classroom.name
        print(f'=== {current_class} ===')
    if e.day_of_week != current_day:
        current_day = e.day_of_week
        print(f'  [{current_day}]')
    print(f'    P{e.period} | {e.subject.name} | {e.teacher.name}')

print()
print('=== VIOLATIONS (same subject > 1x per day) ===')
violations = list(
    SchoolTimetable.objects.values('classroom__name','day_of_week','subject__name')
    .annotate(c=Count('timetable_id')).filter(c__gt=1)
)
if violations:
    for v in violations:
        print(f'  DUPLICATE: {v["classroom__name"]} | {v["day_of_week"]} | {v["subject__name"]} x{v["c"]}')
else:
    print('  NONE - all good')

print()
print('=== MISSING SUBJECTS CHECK ===')
from academics.models import Subject
all_subjects = set(Subject.objects.values_list('name', flat=True))
for cls in ['3A', '3B']:
    scheduled = set(
        SchoolTimetable.objects.filter(classroom__name=cls)
        .values_list('subject__name', flat=True).distinct()
    )
    missing = all_subjects - scheduled
    print(f'  {cls} scheduled subjects: {len(scheduled)}/{len(all_subjects)}')
    if missing:
        print(f'  {cls} MISSING: {missing}')
    else:
        print(f'  {cls} all subjects covered')

print()
print('=== DAYS COVERAGE ===')
EXPECTED_DAYS = {'saturday','sunday','monday','tuesday','wednesday','thursday'}
for cls in ['3A','3B']:
    days_with_classes = set(
        SchoolTimetable.objects.filter(classroom__name=cls)
        .values_list('day_of_week', flat=True).distinct()
    )
    missing_days = EXPECTED_DAYS - days_with_classes
    print(f'  {cls} days covered: {sorted(days_with_classes)}')
    if missing_days:
        print(f'  {cls} MISSING DAYS: {missing_days}')
