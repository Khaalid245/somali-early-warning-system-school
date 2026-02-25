from django.db import models

class SystemSettings(models.Model):
    """System-wide settings stored in database"""
    
    # School Information
    school_name = models.CharField(max_length=255, default='Somali Early Warning School')
    school_code = models.CharField(max_length=50, default='SEWS-001')
    school_address = models.TextField(default='Mogadishu, Somalia')
    school_phone = models.CharField(max_length=50, default='+252-61-000-0000')
    school_email = models.EmailField(default='info@school.com')
    academic_year = models.CharField(max_length=20, default='2024-2025')
    school_logo = models.ImageField(upload_to='school/', null=True, blank=True)
    
    # System Configuration
    absence_threshold = models.IntegerField(default=3)
    auto_escalation_days = models.IntegerField(default=15)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Risk Level Thresholds
    risk_low_min = models.IntegerField(default=0)
    risk_medium_min = models.IntegerField(default=30)
    risk_high_min = models.IntegerField(default=60)
    risk_critical_min = models.IntegerField(default=80)
    
    # Security Settings
    session_timeout = models.IntegerField(default=60)  # minutes
    password_min_length = models.IntegerField(default=8)
    require_uppercase = models.BooleanField(default=True)
    require_numbers = models.BooleanField(default=True)
    data_retention_years = models.IntegerField(default=7)  # FERPA requirement
    two_factor_auth = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'
    
    def __str__(self):
        return f"System Settings - {self.school_name}"
