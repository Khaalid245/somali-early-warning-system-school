from django.db import models
from students.models import Student
from academics.models import Subject


class RiskProfile(models.Model):
    """
    Tracks academic risk per student per subject.
    """

    risk_profile_id = models.AutoField(primary_key=True)

    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    risk_score = models.IntegerField(default=0)
    risk_level = models.CharField(max_length=20)  # low, medium, high
    last_updated = models.DateField(auto_now=True)

    class Meta:
        unique_together = ("student", "subject")

    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name} - {self.risk_level}"
