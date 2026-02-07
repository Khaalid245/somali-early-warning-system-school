from django.db import models
from students.models import Student
from users.models import User
from academics.models import Subject


class CounsellingSession(models.Model):
    PROGRESS_CHOICES = [
        ("in_progress", "In Progress"),
        ("improving", "Improving"),
        ("not_improving", "Not Improving"),
    ]

    session_id = models.AutoField(primary_key=True)
    session_date = models.DateField()
    issues_identified = models.TextField()
    notes = models.TextField()

    progress_status = models.CharField(
        max_length=20,
        choices=PROGRESS_CHOICES,
        default="in_progress"
    )

    admin_notified = models.BooleanField(default=False)

    student = models.ForeignKey(Student, on_delete=models.CASCADE)

    # NEW: Subject this counselling is for
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    counsellor = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name} ({self.session_date})"
