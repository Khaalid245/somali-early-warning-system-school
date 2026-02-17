from django.contrib import admin
from .models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):

    list_display = (
        "student",
        "subject",
        "risk_level",
        "status",
        "alert_type",
        "alert_date",
    )

    list_filter = (
        "risk_level",
        "status",
        "alert_type",
    )

    search_fields = (
        "student__full_name",
    )
