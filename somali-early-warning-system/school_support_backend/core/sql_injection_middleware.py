import re
from django.http import HttpResponseBadRequest
import logging

logger = logging.getLogger(__name__)

class SQLInjectionProtectionMiddleware:
    """Detect and block SQL injection attempts"""
    
    SQL_PATTERNS = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bSELECT\b.*\bFROM\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(--|\#|\/\*|\*\/)",
        r"(\bOR\b.*=.*)",
        r"(\bAND\b.*=.*)",
        r"('.*OR.*'.*=.*')",
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.patterns = [re.compile(p, re.IGNORECASE) for p in self.SQL_PATTERNS]
    
    def __call__(self, request):
        # Check query parameters
        query_string = request.GET.urlencode()
        for pattern in self.patterns:
            if pattern.search(query_string):
                logger.warning(f"SQL injection attempt detected from {request.META.get('REMOTE_ADDR')}: {query_string}")
                return HttpResponseBadRequest("Invalid request")
        
        # Check POST body
        if request.method == 'POST' and request.body:
            try:
                body_str = request.body.decode('utf-8', errors='ignore')
                for pattern in self.patterns:
                    if pattern.search(body_str):
                        logger.warning(f"SQL injection attempt in body from {request.META.get('REMOTE_ADDR')}")
                        return HttpResponseBadRequest("Invalid request")
            except:
                pass
        
        return self.get_response(request)
