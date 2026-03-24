import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_support_backend.settings')
import django
django.setup()

from users.models import User
from unittest.mock import MagicMock
from dashboard.admin_view_safe import AdminDashboardViewSafe

admin = User.objects.filter(role='admin').first()
request = MagicMock()
request.user = admin

view = AdminDashboardViewSafe()
response = view.get(request)

data = response.data
print("monthly_alert_trend:", data.get("monthly_alert_trend"))
print("monthly_case_trend:", data.get("monthly_case_trend"))
print("executive_kpis:", data.get("executive_kpis"))
