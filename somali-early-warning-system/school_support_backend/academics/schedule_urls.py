"""
URL patterns for School Timetable Management System
"""
from django.urls import path
from . import schedule_views

urlpatterns = [
    # Timetable Management (Admin)
    path('timetable/', schedule_views.get_school_timetable, name='school_timetable'),
    path('timetable/create/', schedule_views.create_timetable_entry, name='create_timetable'),
    path('timetable/bulk-create/', schedule_views.bulk_create_timetable, name='bulk_create_timetable'),
    path('timetable/<int:timetable_id>/delete/', schedule_views.delete_timetable_entry, name='delete_timetable'),
    
    # Smart Timetable Generation (NEW)
    path('timetable/generate/', schedule_views.generate_timetable, name='generate_timetable'),
    path('timetable/preview/', schedule_views.preview_generated_timetable, name='preview_timetable'),
    
    # Teacher Schedule
    path('teacher-schedule/', schedule_views.get_teacher_schedule, name='teacher_schedule'),
    path('teacher-schedule/<int:teacher_id>/', schedule_views.get_teacher_schedule, name='teacher_schedule_by_id'),
    
    # Admin Dashboard
    path('attendance-completion/', schedule_views.get_attendance_completion_dashboard, name='attendance_completion_dashboard'),
]