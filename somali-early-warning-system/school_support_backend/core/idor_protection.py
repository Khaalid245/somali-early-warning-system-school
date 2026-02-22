# IDOR Protection Middleware
from rest_framework.exceptions import PermissionDenied
from django.http import Http404
from interventions.models import InterventionCase
from alerts.models import Alert

class IDORProtectionMixin:
    """Mixin to prevent Insecure Direct Object Reference attacks"""
    
    def get_object(self):
        # Get the lookup value from URL kwargs
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        
        # Get model class from queryset
        model = self.get_queryset().model
        
        # Fetch object from unfiltered queryset
        try:
            obj = model.objects.get(**filter_kwargs)
        except model.DoesNotExist:
            raise Http404
        
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
