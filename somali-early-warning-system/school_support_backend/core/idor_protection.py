# IDOR Protection Middleware
from rest_framework.exceptions import PermissionDenied
from interventions.models import InterventionCase
from alerts.models import Alert

class IDORProtectionMixin:
    """Mixin to prevent Insecure Direct Object Reference attacks"""
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Admin can access everything
        if user.role == 'admin':
            return obj
        
        # Check resource ownership based on model type
        if isinstance(obj, InterventionCase):
            if obj.assigned_to != user:
                raise PermissionDenied("You don't have permission to access this case")
        
        elif isinstance(obj, Alert):
            if obj.assigned_to != user:
                raise PermissionDenied("You don't have permission to access this alert")
        
        return obj
