from alerts.models import Alert
from interventions.models import InterventionCase
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncWeek

now = timezone.now()
start = now - timedelta(days=56)  # last 8 weeks

print('=== WEEKLY ALERT TREND (last 8 weeks) ===')
weekly_alerts = (
    Alert.objects.filter(alert_date__gte=start)
    .annotate(week=TruncWeek('alert_date'))
    .values('week')
    .annotate(count=Count('alert_id'))
    .order_by('week')
)
for row in weekly_alerts:
    print(row)

print('=== WEEKLY CASE TREND (last 8 weeks, all statuses) ===')
weekly_cases = (
    InterventionCase.objects.filter(created_at__gte=start)
    .annotate(week=TruncWeek('created_at'))
    .values('week')
    .annotate(count=Count('case_id'))
    .order_by('week')
)
for row in weekly_cases:
    print(row)

print('=== EARLIEST alert date ===')
earliest = Alert.objects.order_by('alert_date').first()
print(earliest.alert_date if earliest else 'No alerts')

print('=== EARLIEST case date ===')
earliest_case = InterventionCase.objects.order_by('created_at').first()
print(earliest_case.created_at if earliest_case else 'No cases')
