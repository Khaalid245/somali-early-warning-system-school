import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger('audit')

class AuditLogMiddleware(MiddlewareMixin):
    """Middleware to log all API requests for audit trail"""
    
    def process_request(self, request):
        # Skip static files and admin
        if request.path.startswith('/static/') or request.path.startswith('/admin/'):
            return None
        
        user = request.user if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else 'Anonymous'
        
        logger.info(
            f"API Request: {request.method} {request.path}",
            extra={
                'user': str(user),
                'ip': self.get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'user') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            user = request.user if not isinstance(request.user, AnonymousUser) else 'Anonymous'
            logger.info(
                f"API Response: {request.method} {request.path} - Status: {response.status_code}",
                extra={'user': str(user)}
            )
        return response
    
    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
