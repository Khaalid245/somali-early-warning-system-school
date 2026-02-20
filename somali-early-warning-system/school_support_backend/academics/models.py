from django.db import models
from students.models import Classroom
from users.models import User


class Subject(models.Model):
    subject_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TeachingAssignment(models.Model):
    """
    Admin assigns: Teacher → Subject → Classroom
    Teacher takes attendance daily until admin changes it
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
    
    is_active = models.BooleanField(default=True, help_text="Admin can deactivate without deleting")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "subject", "classroom")
        ordering = ["classroom", "subject"]

    def __str__(self):
        teacher_name = self.teacher.name if hasattr(self.teacher, 'name') else str(self.teacher)
        status = "✓" if self.is_active else "✗"
        return f"{status} {teacher_name} - {self.subject.name} ({self.classroom.name})"
