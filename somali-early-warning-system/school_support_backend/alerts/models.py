from django.db import models
from students.models import Student
from academics.models import Subject


class Alert(models.Model):
    alert_id = models.AutoField(primary_key=True)

    # Example: "High Risk in Mathematics", "Admin Referral – English"
    alert_type = models.CharField(max_length=100)

    alert_date = models.DateField(auto_now_add=True)
    risk_level = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default="active")

    student = models.ForeignKey(Student, on_delete=models.CASCADE)

    # NEW: Which subject caused this alert
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        if self.subject:
            return f"{self.alert_type} ({self.student.full_name} - {self.subject.name})"
        return f"{self.alert_type} ({self.student.full_name})"
