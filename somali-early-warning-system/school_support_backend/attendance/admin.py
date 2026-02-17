from django.contrib import admin
from .models import AttendanceSession, AttendanceRecord


# -----------------------------------
# Attendance Record Inline
# -----------------------------------
class AttendanceRecordInline(admin.TabularInline):
    model = AttendanceRecord
    extra = 0
    autocomplete_fields = ["student"]
    readonly_fields = []
    show_change_link = True


# -----------------------------------
# Attendance Session Admin
# -----------------------------------
@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):

    list_display = (
        "classroom",
        "subject",
        "teacher",
        "attendance_date",
        "created_at",
    )

    list_filter = (
        "attendance_date",
        "classroom",
        "subject",
    )

    search_fields = (
        "classroom__name",
        "subject__name",
        "teacher__name",
    )

    date_hierarchy = "attendance_date"

    inlines = [AttendanceRecordInline]


# -----------------------------------
# Attendance Record Admin
# -----------------------------------
@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):

    list_display = (
        "student",
        "session",
        "status",
    )

    list_filter = (
        "status",
        "session__attendance_date",
    )

    search_fields = (
        "student__full_name",
        "student__admission_number",
    )
