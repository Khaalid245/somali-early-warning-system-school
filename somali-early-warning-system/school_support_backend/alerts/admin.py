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
        "assigned_to",
        "escalated_to_admin",
        "alert_date",
    )

    list_filter = (
        "risk_level",
        "status",
        "alert_type",
        "escalated_to_admin",
    )

    search_fields = (
        "student__full_name",
        "subject__name",
    )

    autocomplete_fields = (
        "student",
        "subject",
        "assigned_to",
    )

    ordering = ("-alert_date",)
