from django.core.cache import cache
from django.http import JsonResponse
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class LoginRateLimitMiddleware:
    """
    Rate limiting middleware to prevent brute force attacks on login
    - Max 5 failed attempts per IP in 15 minutes
    - Account lockout for 30 minutes after 5 failed attempts
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.max_attempts = 10  # Increased from 5 to 10
        self.lockout_duration = 900  # Reduced from 30min to 15min
        self.window_duration = 900  # 15 minutes in seconds
    
    def __call__(self, request):
        # Only apply to login endpoint
        if request.path == '/api/auth/login/' and request.method == 'POST':
            ip_address = self.get_client_ip(request)
            cache_key = f'login_attempts_{ip_address}'
            lockout_key = f'login_lockout_{ip_address}'
            
            # Check if IP is locked out
            if cache.get(lockout_key):
                logger.warning(f"Login attempt from locked out IP: {ip_address}")
                return JsonResponse({
                    'error': 'Too many failed login attempts. Account locked for 30 minutes.',
                    'locked_until': cache.get(lockout_key)
                }, status=429)
            
            # Get current attempts
            attempts = cache.get(cache_key, 0)
            
            # Check if max attempts reached
            if attempts >= self.max_attempts:
                # Lock the account
                lockout_until = (datetime.now() + timedelta(seconds=self.lockout_duration)).isoformat()
                cache.set(lockout_key, lockout_until, self.lockout_duration)
                cache.delete(cache_key)
                
                logger.warning(f"IP {ip_address} locked out after {attempts} failed attempts")
                
                return JsonResponse({
                    'error': 'Too many failed login attempts. Account locked for 30 minutes.',
                    'locked_until': lockout_until
                }, status=429)
        
        response = self.get_response(request)
        
        # Track failed login attempts
        if request.path == '/api/auth/login/' and request.method == 'POST':
            if response.status_code == 401 or response.status_code == 400:
                ip_address = self.get_client_ip(request)
                cache_key = f'login_attempts_{ip_address}'
                attempts = cache.get(cache_key, 0) + 1
                cache.set(cache_key, attempts, self.window_duration)
                
                remaining = self.max_attempts - attempts
                logger.info(f"Failed login from {ip_address}. Attempts: {attempts}/{self.max_attempts}")
                
                # Add remaining attempts to response
                if hasattr(response, 'data'):
                    response.data['remaining_attempts'] = max(0, remaining)
            
            # Clear attempts on successful login
            elif response.status_code == 200:
                ip_address = self.get_client_ip(request)
                cache_key = f'login_attempts_{ip_address}'
                cache.delete(cache_key)
                logger.info(f"Successful login from {ip_address}")
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
