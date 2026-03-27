"""
Professional School Timetable/Schedule Management System
For Capstone Project - School Early Warning System
"""
from django.db import models
from django.core.exceptions import ValidationError
from students.models import Classroom
from users.models import User
from .models import Subject


class SchoolTimetable(models.Model):
    """
    Master timetable configuration for the school
    Admin creates this once per academic term/year
    """
    
    DAYS_OF_WEEK = [
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
    ]
    
    PERIOD_CHOICES = [
        ('1', 'Period 1 (8:00-8:45)'),
        ('2', 'Period 2 (8:45-9:30)'),
        ('3', 'Period 3 (9:30-10:15)'),
        # LUNCH BREAK: 10:15-11:00 (45 minutes)
        ('4', 'Period 4 (11:00-11:45)'),
        ('5', 'Period 5 (11:45-12:30)'),
        ('6', 'Period 6 (12:30-1:15)'),
    ]
    
    timetable_id = models.AutoField(primary_key=True)
    
    # Basic Info
    academic_year = models.CharField(max_length=20, help_text="e.g., 2024-2025")
    term = models.CharField(max_length=20, help_text="e.g., Term 1, Semester 1")
    
    # Schedule Assignment
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='timetables')
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    period = models.CharField(max_length=2, choices=PERIOD_CHOICES)
    
    # Teaching Assignment
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable_slots')
    teacher = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'teacher'},
        related_name='timetable_slots'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'admin'},
        related_name='created_timetables'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [
            ('classroom', 'day_of_week', 'period'),  # One class can't have 2 subjects same time
            ('teacher', 'day_of_week', 'period'),    # One teacher can't be in 2 places same time
        ]
        ordering = ['classroom', 'day_of_week', 'period']
        indexes = [
            models.Index(fields=['classroom', 'day_of_week']),
            models.Index(fields=['teacher', 'day_of_week']),
        ]
    
    def clean(self):
        """Validation rules for professional school scheduling"""
        if self.teacher.role != 'teacher':
            raise ValidationError("Only users with 'teacher' role can be assigned to timetable slots.")
    
    def __str__(self):
        return f"{self.classroom.name} | {self.get_day_of_week_display()} P{self.period} | {self.subject.name} ({self.teacher.name})"


class TimetableTemplate(models.Model):
    """
    Reusable timetable templates for different classroom types
    Admin can create templates and apply them to multiple classrooms
    """
    
    template_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, help_text="e.g., 'Grade 10 Science Track', 'Grade 12 Arts Track'")
    description = models.TextField(blank=True)
    
    # Template can be applied to classrooms of this grade level
    target_grade = models.CharField(max_length=20, help_text="e.g., 'Grade 10', 'Form 4'")
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'admin'})
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['target_grade', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.target_grade})"


class TimetableTemplateSlot(models.Model):
    """
    Individual time slots within a timetable template
    """
    
    template = models.ForeignKey(TimetableTemplate, on_delete=models.CASCADE, related_name='slots')
    day_of_week = models.CharField(max_length=10, choices=SchoolTimetable.DAYS_OF_WEEK)
    period = models.CharField(max_length=2, choices=SchoolTimetable.PERIOD_CHOICES)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    
    # Optional: Preferred teacher (can be overridden when applying template)
    preferred_teacher = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'role': 'teacher'}
    )
    
    class Meta:
        unique_together = ('template', 'day_of_week', 'period')
        ordering = ['day_of_week', 'period']
    
    def __str__(self):
        return f"{self.template.name} | {self.get_day_of_week_display()} P{self.period} | {self.subject.name}"


class AttendanceScheduleView(models.Model):
    """
    Read-only view for teachers to see their daily attendance responsibilities
    Generated automatically from SchoolTimetable
    """
    
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_schedule')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=10, choices=SchoolTimetable.DAYS_OF_WEEK)
    period = models.CharField(max_length=2, choices=SchoolTimetable.PERIOD_CHOICES)
    
    # Status tracking
    is_completed_today = models.BooleanField(default=False)  # Reset daily
    last_attendance_date = models.DateField(null=True, blank=True)
    
    class Meta:
        managed = False  # This will be a database view
        db_table = 'attendance_schedule_view'
    
    def __str__(self):
        status = "✅" if self.is_completed_today else "⏳"
        return f"{status} {self.teacher.name} | {self.classroom.name} | P{self.period} | {self.subject.name}"


# Helper functions for admin interface
def get_teacher_daily_schedule(teacher, day_of_week):
    """Get all periods assigned to a teacher for a specific day"""
    return SchoolTimetable.objects.filter(
        teacher=teacher,
        day_of_week=day_of_week,
        is_active=True
    ).order_by('period')


def get_classroom_daily_schedule(classroom, day_of_week):
    """Get complete schedule for a classroom on a specific day"""
    return SchoolTimetable.objects.filter(
        classroom=classroom,
        day_of_week=day_of_week,
        is_active=True
    ).order_by('period')


def check_schedule_conflicts(teacher, classroom, day_of_week, period):
    """Check if there are any scheduling conflicts before creating timetable entry"""
    conflicts = []
    
    # Check if teacher is already assigned elsewhere
    teacher_conflict = SchoolTimetable.objects.filter(
        teacher=teacher,
        day_of_week=day_of_week,
        period=period,
        is_active=True
    ).exclude(classroom=classroom)
    
    if teacher_conflict.exists():
        conflicts.append(f"Teacher {teacher.name} is already assigned to {teacher_conflict.first().classroom.name} at this time")
    
    # Check if classroom already has a subject
    classroom_conflict = SchoolTimetable.objects.filter(
        classroom=classroom,
        day_of_week=day_of_week,
        period=period,
        is_active=True
    ).exclude(teacher=teacher)
    
    if classroom_conflict.exists():
        conflicts.append(f"Classroom {classroom.name} already has {classroom_conflict.first().subject.name} at this time")
    
    return conflicts


def get_attendance_completion_rate(classroom, date):
    """Calculate what percentage of scheduled periods have attendance recorded"""
    from attendance.models import AttendanceSession
    from datetime import datetime
    
    day_name = date.strftime('%A').lower()
    
    # Get scheduled periods for this classroom on this day
    scheduled_periods = SchoolTimetable.objects.filter(
        classroom=classroom,
        day_of_week=day_name,
        is_active=True
    ).count()
    
    if scheduled_periods == 0:
        return 100  # No classes scheduled = 100% complete
    
    # Get recorded attendance sessions
    recorded_sessions = AttendanceSession.objects.filter(
        classroom=classroom,
        attendance_date=date
    ).count()
    
    completion_rate = (recorded_sessions / scheduled_periods) * 100
    return min(completion_rate, 100)  # Cap at 100%