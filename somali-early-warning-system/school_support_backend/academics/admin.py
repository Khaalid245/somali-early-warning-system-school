from django.contrib import admin
from .models import Subject, TeachingAssignment


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(TeachingAssignment)
class TeachingAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "subject", "classroom")
    search_fields = (
        "teacher__name",
        "subject__name",
        "classroom__name",
    )
