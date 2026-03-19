from django.db import models
from students.models import Classroom
from users.models import User


class Subject(models.Model):
    """Enhanced Subject model with scheduling metadata"""
    
    SUBJECT_TYPE_CHOICES = [
        ('core', 'Core Subject'),
        ('elective', 'Elective'),
        ('activity', 'Activity/Sports'),
        ('language', 'Language'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('moderate', 'Moderate'),
        ('difficult', 'Difficult'),
    ]
    
    subject_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    # Scheduling metadata
    subject_type = models.CharField(max_length=20, choices=SUBJECT_TYPE_CHOICES, default='core')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='moderate')
    priority = models.IntegerField(default=3, help_text="1=Highest (5 periods/week), 5=Lowest (1 period/week)")
    
    # Scheduling constraints
    can_be_first_period = models.BooleanField(default=True, help_text="Can this subject be scheduled in Period 1?")
    preferred_periods = models.CharField(max_length=50, blank=True, help_text="Comma-separated period numbers, e.g., '1,2,3'")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["priority", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_subject_type_display()})"
    
    def get_weekly_periods(self):
        """Calculate recommended periods per week based on priority"""
        priority_map = {1: 5, 2: 4, 3: 3, 4: 2, 5: 1}
        return priority_map.get(self.priority, 3)


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
