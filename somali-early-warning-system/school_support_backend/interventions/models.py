from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q
from students.models import Student
from alerts.models import Alert
from users.models import User


# =====================================================
# INTERVENTION MEETING (Form Master Meeting Records)
# =====================================================
class InterventionMeeting(models.Model):
    """Records of Form Master meetings with students for absence intervention"""
    
    ROOT_CAUSE_CHOICES = [
        ('health', 'Health Issue'),
        ('family', 'Family Issue'),
        ('academic', 'Academic Difficulty'),
        ('financial', 'Financial Issue'),
        ('behavioral', 'Behavioral Issue'),
        ('other', 'Other'),
    ]
    
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('monitoring', 'Monitoring'),
        ('improving', 'Improving'),
        ('not_improving', 'Not Improving'),
        ('escalated', 'Escalated'),
        ('closed', 'Closed'),
    ]
    
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='intervention_meetings'
    )
    
    meeting_date = models.DateField()
    absence_reason = models.TextField()
    root_cause = models.CharField(max_length=20, choices=ROOT_CAUSE_CHOICES)
    intervention_notes = models.TextField()
    action_plan = models.TextField()
    follow_up_date = models.DateField(null=True, blank=True)
    urgency_level = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_meetings'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-meeting_date', '-created_at']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['urgency_level']),
        ]
    
    def clean(self):
        """Validate no duplicate active interventions for same student and root cause"""
        if self.status in ['open', 'monitoring', 'improving', 'not_improving', 'escalated']:
            existing = InterventionMeeting.objects.filter(
                student=self.student,
                root_cause=self.root_cause,
                status__in=['open', 'monitoring', 'improving', 'not_improving', 'escalated']
            ).exclude(pk=self.pk)
            
            if existing.exists():
                raise ValidationError(
                    f'An active intervention for {self.get_root_cause_display()} already exists for this student. '
                    f'Please close the existing intervention before creating a new one.'
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.full_name} - {self.get_root_cause_display()} ({self.meeting_date})"


# =====================================================
# PROGRESS UPDATE (Chronological Progress Tracking)
# =====================================================
class ProgressUpdate(models.Model):
    """Chronological progress updates for intervention meetings"""
    
    meeting = models.ForeignKey(
        InterventionMeeting,
        on_delete=models.CASCADE,
        related_name='progress_updates'
    )
    
    update_text = models.TextField()
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='progress_updates'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Progress update for {self.meeting} at {self.created_at}"


# =====================================================
# INTERVENTION CASE (Main Case Object)
# =====================================================
class InterventionCase(models.Model):
    """Intervention case with optimistic locking for race condition prevention"""

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

    # Progress tracking
    resolution_notes = models.TextField(blank=True, null=True)
    escalation_reason = models.TextField(blank=True, null=True)
    
    # Meeting tracking
    meeting_date = models.DateField(null=True, blank=True)
    meeting_notes = models.TextField(blank=True, null=True)
    
    # Progress status
    PROGRESS_CHOICES = [
        ('no_contact', 'No Contact Yet'),
        ('contacted', 'Student Contacted'),
        ('improving', 'Showing Improvement'),
        ('not_improving', 'Not Improving'),
        ('resolved', 'Issue Resolved'),
    ]
    progress_status = models.CharField(
        max_length=20,
        choices=PROGRESS_CHOICES,
        default='no_contact'
    )
    
    # Version control for optimistic locking
    version = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """Override save to implement version control"""
        if self.pk:
            # Get current version from database
            current = InterventionCase.objects.filter(pk=self.pk).first()
            if current and hasattr(self, '_client_version'):
                if current.version != self._client_version:
                    raise ValidationError(
                        'Case was modified by another user. Please refresh and try again.'
                    )
            self.version += 1
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["assigned_to"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - Case #{self.case_id}"
