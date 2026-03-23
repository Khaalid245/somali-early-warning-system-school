from alerts.models import Alert
from interventions.models import InterventionCase
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncMonth

now = timezone.now()
start = (now - timedelta(days=180)).replace(day=1)

print('=== MONTHLY ALERT TREND ===')
monthly_alerts = (
    Alert.objects.filter(status__in=['active','under_review','escalated'], alert_date__gte=start)
    .annotate(month=TruncMonth('alert_date'))
    .values('month')
    .annotate(count=Count('alert_id'))
    .order_by('month')
)
for row in monthly_alerts:
    print(row)

print('=== MONTHLY CASE TREND ===')
monthly_cases = (
    InterventionCase.objects.filter(status__in=['open','in_progress','awaiting_parent','escalated_to_admin'], created_at__gte=start)
    .annotate(month=TruncMonth('created_at'))
    .values('month')
    .annotate(count=Count('case_id'))
    .order_by('month')
)
for row in monthly_cases:
    print(row)

print('=== ALL ALERTS by month (any status) ===')
all_monthly = (
    Alert.objects.filter(alert_date__gte=start)
    .annotate(month=TruncMonth('alert_date'))
    .values('month')
    .annotate(count=Count('alert_id'))
    .order_by('month')
)
for row in all_monthly:
    print(row)
