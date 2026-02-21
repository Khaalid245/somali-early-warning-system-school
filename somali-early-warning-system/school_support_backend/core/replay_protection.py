# Replay Attack Prevention Middleware
from django.core.cache import cache
from django.http import JsonResponse
import hashlib
import time

class ReplayAttackProtectionMiddleware:
    """Prevent replay attacks on state-changing requests"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Only check state-changing methods
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Get nonce and timestamp from headers
            nonce = request.headers.get('X-Request-Nonce')
            timestamp = request.headers.get('X-Request-Timestamp')
            
            if nonce and timestamp:
                try:
                    # Check if request is too old (5 minutes)
                    request_time = float(timestamp)
                    current_time = time.time()
                    
                    if current_time - request_time > 300:  # 5 minutes
                        return JsonResponse({
                            'error': 'Request expired. Please try again.'
                        }, status=400)
                    
                    # Check if nonce was already used
                    cache_key = f'nonce:{nonce}'
                    if cache.get(cache_key):
                        return JsonResponse({
                            'error': 'Duplicate request detected. Request already processed.'
                        }, status=409)
                    
                    # Store nonce for 10 minutes
                    cache.set(cache_key, True, 600)
                    
                except (ValueError, TypeError):
                    pass  # Invalid timestamp format, continue without replay protection
        
        response = self.get_response(request)
        return response
