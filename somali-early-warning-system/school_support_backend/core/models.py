from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('ALERT_STATUS_CHANGE', 'Alert Status Changed'),
        ('CASE_PROGRESS_UPDATE', 'Case Progress Updated'),
        ('CASE_ESCALATED', 'Case Escalated to Admin'),
        ('STUDENT_CREATED', 'Student Created'),
        ('ATTENDANCE_RECORDED', 'Attendance Recorded'),
        ('USER_LOGIN', 'User Logged In'),
        ('USER_LOGOUT', 'User Logged Out'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"
