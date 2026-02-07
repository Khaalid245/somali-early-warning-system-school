from django.db import models
from counselling.models import CounsellingSession
from users.models import User
from alerts.models import Alert
from academics.models import Subject


class Intervention(models.Model):
    intervention_id = models.AutoField(primary_key=True)
    description = models.TextField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, default="pending")  # pending, in_progress, completed
    created_at = models.DateTimeField(auto_now_add=True)

    # Counselling session that created this intervention
    session = models.ForeignKey(CounsellingSession, on_delete=models.CASCADE)

    # Alert that triggered this intervention
    alert = models.ForeignKey(
        Alert,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interventions"
    )

    # NEW: Subject this intervention is for
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    # Who is responsible for this intervention?
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_interventions"
    )

    def __str__(self):
        return f"{self.session.student.full_name} - {self.subject.name} (Intervention)"
