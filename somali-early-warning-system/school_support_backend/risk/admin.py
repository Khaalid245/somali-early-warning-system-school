from django.contrib import admin
from .models import StudentRiskProfile, SubjectRiskInsight


@admin.register(StudentRiskProfile)
class StudentRiskProfileAdmin(admin.ModelAdmin):
    list_display = ("student", "risk_score", "risk_level", "last_calculated")
    list_filter = ("risk_level",)
    search_fields = ("student__full_name",)


@admin.register(SubjectRiskInsight)
class SubjectRiskInsightAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "subject",
        "total_sessions",
        "absence_count",
        "late_count",
        "absence_rate",
        "last_calculated",
    )
    search_fields = ("student__full_name", "subject__name")
