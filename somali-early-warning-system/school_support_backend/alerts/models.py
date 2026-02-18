from django.db import models
from django.core.validators import MinLengthValidator
from django.utils import timezone

from students.models import Student
from academics.models import Subject
from users.models import User


class Alert(models.Model):

    # -------------------------------------------------
    # ALERT TYPE
    # -------------------------------------------------
    ALERT_TYPE_CHOICES = [
        ("attendance", "Attendance Risk"),
        ("behavior", "Behavior Risk"),
        ("academic", "Academic Risk"),
    ]

    # -------------------------------------------------
    # RISK LEVEL
    # -------------------------------------------------
    RISK_LEVEL_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    # -------------------------------------------------
    # WORKFLOW STATUS
    # -------------------------------------------------
    STATUS_CHOICES = [
        ("active", "Active"),
        ("under_review", "Under Review"),
        ("escalated", "Escalated"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    ]

    # -------------------------------------------------
    # PRIMARY KEY
    # -------------------------------------------------
    alert_id = models.AutoField(primary_key=True)

    # -------------------------------------------------
    # CORE DATA
    # -------------------------------------------------
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

    # -------------------------------------------------
    # RELATIONSHIPS
    # -------------------------------------------------
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

    # Assigned Form Master (Workflow Owner)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "form_master"},
        related_name="assigned_alerts"
    )

    # Escalation flag
    escalated_to_admin = models.BooleanField(default=False)

    # -------------------------------------------------
    # TIMESTAMPS
    # -------------------------------------------------
    alert_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # -------------------------------------------------
    # INDEXING FOR PERFORMANCE
    # -------------------------------------------------
    class Meta:
        indexes = [
            models.Index(fields=["risk_level"]),
            models.Index(fields=["status"]),
            models.Index(fields=["student"]),
            models.Index(fields=["assigned_to"]),
        ]

    # -------------------------------------------------
    # STRING REPRESENTATION
    # -------------------------------------------------
    def __str__(self):
        if self.subject:
            return f"{self.student.full_name} - {self.subject.name} ({self.risk_level})"
        return f"{self.student.full_name} - Overall Risk ({self.risk_level})"
