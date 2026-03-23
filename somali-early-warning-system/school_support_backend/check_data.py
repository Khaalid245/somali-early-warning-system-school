from alerts.models import Alert
from interventions.models import InterventionCase
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, TruncMonth

now = timezone.now()
start = (now - timedelta(days=180)).replace(day=1)

alerts_filtered = Alert.objects.filter(status__in=['active','under_review','escalated'], alert_date__gte=start).count()
cases_filtered = InterventionCase.objects.filter(status__in=['open','in_progress','awaiting_parent','escalated_to_admin'], created_at__gte=start).count()
all_alerts = Alert.objects.count()
all_cases = InterventionCase.objects.count()
alert_statuses = list(Alert.objects.values('status').annotate(c=Count('alert_id')))
case_statuses = list(InterventionCase.objects.values('status').annotate(c=Count('case_id')))

print('=== CHART DATA DIAGNOSIS ===')
print('Filtered alerts (active/under_review/escalated, last 6mo):', alerts_filtered)
print('Filtered cases (open/in_progress/etc, last 6mo):', cases_filtered)
print('ALL alerts in DB total:', all_alerts)
print('ALL cases in DB total:', all_cases)
print('Alert statuses in DB:', alert_statuses)
print('Case statuses in DB:', case_statuses)

# Monthly breakdown
print('\n=== MONTHLY ALERT TREND (what backend returns) ===')
monthly_alerts = (
    Alert.objects.filter(status__in=['active','under_review','escalated'], alert_date__gte=start)
    .annotate(month=TruncMonth('alert_date'))
    .values('month')
    .annotate(count=Count('*'))
    .order_by('month')
)
for row in monthly_alerts:
    print(row)

print('\n=== MONTHLY CASE TREND (what backend returns) ===')
monthly_cases = (
    InterventionCase.objects.filter(status__in=['open','in_progress','awaiting_parent','escalated_to_admin'], created_at__gte=start)
    .annotate(month=TruncMonth('created_at'))
    .values('month')
    .annotate(count=Count('*'))
    .order_by('month')
)
for row in monthly_cases:
    print(row)
