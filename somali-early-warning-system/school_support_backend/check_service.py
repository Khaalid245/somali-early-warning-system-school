import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
django.setup()

from dashboard.services import get_admin_dashboard_data
from users.models import User

admin = User.objects.filter(role='admin').first()
print("Admin user:", admin)

result = get_admin_dashboard_data(admin, {})
print("monthly_alert_trend:", result.get("monthly_alert_trend"))
print("monthly_case_trend:", result.get("monthly_case_trend"))
