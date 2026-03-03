from django.apps import AppConfig


class DashboardConfig(AppConfig):
    name = 'dashboard'
    
    def ready(self):
        """Import signals when app is ready"""
        import dashboard.signals  # noqa
