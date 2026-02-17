from django.db import models
from students.models import Student
from academics.models import Subject


class Alert(models.Model):

    ALERT_TYPE_CHOICES = [
        ("attendance", "Attendance Risk"),
        ("behavior", "Behavior Risk"),
        ("academic", "Academic Risk"),
    ]

    RISK_LEVEL_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    ]

    alert_id = models.AutoField(primary_key=True)

    alert_type = models.CharField(
        max_length=20,
        choices=ALERT_TYPE_CHOICES
    )

    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="alerts"
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alerts"
    )

    alert_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["risk_level"]),
            models.Index(fields=["status"]),
            models.Index(fields=["student"]),
        ]

    def __str__(self):
        if self.subject:
            return f"{self.student.full_name} - {self.subject.name} ({self.risk_level})"
        return f"{self.student.full_name} - Overall Risk ({self.risk_level})"
