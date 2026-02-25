import re
from django.http import HttpResponseBadRequest
import logging

logger = logging.getLogger(__name__)

class SQLInjectionProtectionMiddleware:
    """Detect and block obvious SQL injection attempts (Django ORM provides base protection)"""
    
    # Only block obvious malicious patterns
    SQL_PATTERNS = [
        r"(;\s*DROP\s+TABLE)",  # DROP TABLE
        r"(;\s*DELETE\s+FROM)",  # DELETE FROM
        r"(UNION\s+ALL\s+SELECT)",  # UNION SELECT
        r"(\bOR\s+1\s*=\s*1)",  # OR 1=1
        r"(\bOR\s+'1'\s*=\s*'1')",  # OR '1'='1'
        r"(--\s*$)",  # SQL comment at end
        r"(;\s*--)",  # SQL comment after semicolon
    ]
    
    # Paths that should never have SQL in them
    CHECKED_PATHS = [
        '/api/students/',
        '/api/attendance/',
        '/api/alerts/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.patterns = [re.compile(p, re.IGNORECASE) for p in self.SQL_PATTERNS]
    
    def __call__(self, request):
        # Only check specific paths to avoid false positives
        should_check = any(request.path.startswith(path) for path in self.CHECKED_PATHS)
        
        if should_check:
            query_string = request.GET.urlencode()
            for pattern in self.patterns:
                if pattern.search(query_string):
                    logger.warning(f"SQL injection attempt from {request.META.get('REMOTE_ADDR')}: {query_string}")
                    return HttpResponseBadRequest("Invalid request")
        
        return self.get_response(request)
