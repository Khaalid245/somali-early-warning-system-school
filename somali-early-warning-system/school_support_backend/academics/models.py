from django.db import models
from students.models import Classroom
from users.models import User


class Subject(models.Model):
    subject_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TeachingAssignment(models.Model):
    """
    Links a teacher to a subject and a classroom.
    Example:
    Mr Ahmed teaches Mathematics to Form 3A
    """

    assignment_id = models.AutoField(primary_key=True)

    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="teaching_assignments"
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="assignments"
    )

    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name="teaching_assignments"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "subject", "classroom")
        ordering = ["classroom", "subject"]

    def __str__(self):
        return f"{self.teacher.name} - {self.subject.name} ({self.classroom.name})"
