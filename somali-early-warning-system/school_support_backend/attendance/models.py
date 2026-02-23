from django.db import models
from students.models import Student, Classroom
from users.models import User
from academics.models import Subject


# -----------------------------------
# ATTENDANCE SESSION (Master)
# -----------------------------------
class AttendanceSession(models.Model):

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("classroom", "subject", "attendance_date")
        indexes = [
            models.Index(fields=["attendance_date"]),
            models.Index(fields=["classroom", "subject"]),
        ]

    def __str__(self):
        return f"{self.classroom.name} - {self.subject.name} - {self.attendance_date}"


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

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("session", "student")
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.status}"
