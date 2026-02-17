from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

from students.models import Student
from academics.models import Subject


# -----------------------------------
# OVERALL STUDENT RISK PROFILE
# -----------------------------------
class StudentRiskProfile(models.Model):
    """
    Stores overall behavioral and attendance risk
    for a student. One record per student.
    """

    RISK_LEVEL_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        related_name="risk_profile"
    )

    risk_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0)]
    )

    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        default="low"
    )

    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["risk_level"]),
            models.Index(fields=["risk_score"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.risk_level}"


# -----------------------------------
# SUBJECT-LEVEL RISK INSIGHTS
# -----------------------------------
class SubjectRiskInsight(models.Model):
    """
    Stores subject-level attendance analytics
    contributing to overall student risk.
    Analytical metrics only.
    """

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="subject_risk_insights"
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="student_risk_insights"
    )

    total_sessions = models.IntegerField(default=0)
    absence_count = models.IntegerField(default=0)
    late_count = models.IntegerField(default=0)

    absence_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0)]
    )

    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "subject")
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["subject"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name}"
