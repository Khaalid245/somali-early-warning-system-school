from django.contrib import admin
from .models import InterventionCase, InterventionMeeting, ProgressUpdate


@admin.register(InterventionMeeting)
class InterventionMeetingAdmin(admin.ModelAdmin):
    list_display = ['student', 'meeting_date', 'root_cause', 'status', 'urgency_level', 'created_by', 'created_at']
    list_filter = ['status', 'urgency_level', 'root_cause', 'meeting_date']
    search_fields = ['student__full_name', 'student__student_id', 'absence_reason', 'intervention_notes']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'meeting_date'
    
    fieldsets = (
        ('Student Information', {
            'fields': ('student', 'meeting_date')
        }),
        ('Intervention Details', {
            'fields': ('absence_reason', 'root_cause', 'intervention_notes', 'action_plan')
        }),
        ('Follow-up', {
            'fields': ('follow_up_date', 'urgency_level', 'status')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProgressUpdate)
class ProgressUpdateAdmin(admin.ModelAdmin):
    list_display = ['meeting', 'created_by', 'created_at', 'update_preview']
    list_filter = ['created_at']
    search_fields = ['meeting__student__full_name', 'update_text']
    readonly_fields = ['created_at']
    
    def update_preview(self, obj):
        return obj.update_text[:50] + '...' if len(obj.update_text) > 50 else obj.update_text
    update_preview.short_description = 'Update Preview'


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
