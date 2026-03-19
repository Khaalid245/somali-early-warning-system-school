from django.db import models
from students.models import Student, Classroom
from users.models import User
from academics.models import Subject
from django.utils import timezone


# -----------------------------------
# ATTENDANCE SESSION (Master)
# -----------------------------------
class AttendanceSession(models.Model):

    PERIOD_CHOICES = [
        ('1', 'Period 1'),
        ('2', 'Period 2'), 
        ('3', 'Period 3'),
        ('4', 'Period 4'),
        ('5', 'Period 5'),
        ('6', 'Period 6'),
        ('morning', 'Morning Session'),
        ('afternoon', 'Afternoon Session'),
    ]

    session_id = models.AutoField(primary_key=True)

    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name="attendance_sessions",
        db_index=True
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="attendance_sessions",
        db_index=True
    )

    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="attendance_sessions",
        db_index=True
    )

    attendance_date = models.DateField(db_index=True)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='1')
    recorded_at = models.DateTimeField(default=timezone.now)  # When attendance was taken

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("classroom", "subject", "teacher", "attendance_date", "period")
        indexes = [
            models.Index(fields=["attendance_date"]),
            models.Index(fields=["classroom", "subject"]),
            models.Index(fields=["recorded_at"]),
        ]

    def __str__(self):
        return f"{self.classroom.name} - {self.subject.name} - {self.attendance_date} ({self.period})"


# -----------------------------------
# ATTENDANCE RECORD (Per Student)
# -----------------------------------
class AttendanceRecord(models.Model):

    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("excused", "Excused"),
    ]

    record_id = models.AutoField(primary_key=True)

    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name="records",
        db_index=True
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records",
        db_index=True
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES
    )

    remarks = models.TextField(blank=True, null=True)
    marked_at = models.DateTimeField(default=timezone.now)  # Exact time student was marked

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("session", "student")
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["status"]),
            models.Index(fields=["marked_at"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.status}"


# -----------------------------------
# ARCHIVE MODELS (Industry Standard)
# -----------------------------------
class AttendanceSessionArchive(models.Model):
    """Archive for old attendance sessions (2+ years)"""
    
    session_id = models.AutoField(primary_key=True)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name="archived_sessions")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="archived_sessions")
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="archived_sessions")
    attendance_date = models.DateField(db_index=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    archived_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'attendance_session_archive'
        indexes = [models.Index(fields=["attendance_date"])]
    
    def __str__(self):
        return f"[ARCHIVE] {self.classroom.name} - {self.subject.name} - {self.attendance_date}"


class AttendanceRecordArchive(models.Model):
    """Archive for old attendance records (2+ years)"""
    
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("excused", "Excused"),
    ]
    
    record_id = models.AutoField(primary_key=True)
    session = models.ForeignKey(AttendanceSessionArchive, on_delete=models.CASCADE, related_name="records")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="archived_attendance_records")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    archived_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'attendance_record_archive'
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["status"]),
        ]
    
    def __str__(self):
        return f"[ARCHIVE] {self.student.full_name} - {self.status}"


# -----------------------------------
# ATTENDANCE AUDIT TRAIL
# -----------------------------------
class AttendanceAudit(models.Model):
    """Audit trail for attendance changes"""
    
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
    ]
    
    record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    old_status = models.CharField(max_length=10, blank=True, null=True)
    new_status = models.CharField(max_length=10, blank=True, null=True)
    old_remarks = models.TextField(blank=True, null=True)
    new_remarks = models.TextField(blank=True, null=True)
    
    changed_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='attendance_changes'
    )
    
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['record', 'changed_at']),
            models.Index(fields=['changed_by']),
        ]
    
    def __str__(self):
        return f"{self.record.student.full_name} - {self.action} by {self.changed_by.email}"


# -----------------------------------
# SCHOOL SETTINGS (Configurable Thresholds)
# -----------------------------------
class SchoolSettings(models.Model):
    """Configurable school-wide attendance settings"""
    
    # Absence thresholds
    consecutive_absence_threshold = models.IntegerField(default=3, help_text="Days of consecutive absence before alert")
    monthly_absence_threshold = models.IntegerField(default=5, help_text="Monthly absences before intervention")
    
    # Tardiness settings
    late_arrival_minutes = models.IntegerField(default=15, help_text="Minutes late before marked as tardy")
    tardy_threshold = models.IntegerField(default=3, help_text="Tardies per week before alert")
    
    # Notification settings
    parent_notification_enabled = models.BooleanField(default=True)
    admin_notification_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "School Settings"
        verbose_name_plural = "School Settings"
    
    def __str__(self):
        return f"School Settings (Updated: {self.updated_at.strftime('%Y-%m-%d')})"
    
    @classmethod
    def get_settings(cls):
        """Get or create school settings"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
