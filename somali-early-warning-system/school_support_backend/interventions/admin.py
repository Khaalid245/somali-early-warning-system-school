from django.contrib import admin
from .models import InterventionCase


@admin.register(InterventionCase)
class InterventionCaseAdmin(admin.ModelAdmin):

    list_display = (
        "case_id",
        "student",
        "assigned_to",
        "status",
        "follow_up_date",
        "created_at",
    )

    list_filter = (
        "status",
        "assigned_to",
    )

    search_fields = (
        "student__full_name",
    )

    ordering = ("-created_at",)
