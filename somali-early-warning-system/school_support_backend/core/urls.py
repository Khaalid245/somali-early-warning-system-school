from django.urls import path
from .views import log_audit, get_audit_logs, export_audit_logs
from .health import health_check

urlpatterns = [
    path('audit/', log_audit, name='log_audit'),
    path('audit/logs/', get_audit_logs, name='get_audit_logs'),
    path('audit/export/', export_audit_logs, name='export_audit_logs'),
    path('health/', health_check, name='health_check'),
]
