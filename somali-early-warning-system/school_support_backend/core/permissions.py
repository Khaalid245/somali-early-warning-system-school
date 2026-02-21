from django.http import JsonResponse
from functools import wraps

def require_role(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            if request.user.role not in allowed_roles:
                return JsonResponse({'error': 'Insufficient permissions'}, status=403)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def validate_resource_ownership(model, id_param='pk', owner_field='assigned_to'):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            resource_id = kwargs.get(id_param)
            try:
                resource = model.objects.get(pk=resource_id)
                owner = getattr(resource, owner_field)
                
                if owner != request.user and request.user.role != 'admin':
                    return JsonResponse({'error': 'Not authorized for this resource'}, status=403)
                
            except model.DoesNotExist:
                return JsonResponse({'error': 'Resource not found'}, status=404)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
