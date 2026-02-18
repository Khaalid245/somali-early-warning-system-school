from django.db import models
from students.models import Student
from alerts.models import Alert
from users.models import User


# =====================================================
# INTERVENTION CASE (Main Case Object)
# =====================================================
class InterventionCase(models.Model):

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("awaiting_parent", "Awaiting Parent Meeting"),
        ("escalated_to_admin", "Escalated to Admin"),
        ("closed", "Closed"),
    ]

    case_id = models.AutoField(primary_key=True)

    # Student involved
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="intervention_cases"
    )

    # Alert that triggered this case
    alert = models.ForeignKey(
        Alert,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cases"
    )

    # Assigned Form Master (case owner)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "form_master"},
        related_name="managed_cases"
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="open"
    )

    follow_up_date = models.DateField(null=True, blank=True)

    outcome_notes = models.TextField(blank=True, null=True)

    # ✅ NEW FIELD (Required for professional audit trail)
    resolution_notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["assigned_to"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - Case #{self.case_id}"
