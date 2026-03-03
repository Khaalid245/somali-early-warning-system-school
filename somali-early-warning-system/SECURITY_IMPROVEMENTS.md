# Security Improvements Required

## 🔴 CRITICAL - Fix Immediately

### 1. Remove Hardcoded Secrets
**Location:** `school_support_backend/settings.py`

**Issue:**
```python
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-hy5$%i5u90atz#rwy-yqp1*7v!#*63v@t_!%n7#7yh(hv^l^an')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'SchoolSupport123')
```

**Fix:**
```python
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

DB_PASSWORD = os.getenv('DB_PASSWORD')
if not DB_PASSWORD:
    raise ValueError("DB_PASSWORD environment variable must be set")
```

### 2. Restrict CORS Origins
**Location:** `school_support_backend/settings.py` Line 207

**Issue:**
```python
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True  # ❌ Allows ANY website to access API
```

**Fix:**
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_ALL_ORIGINS = False  # Always False
```

### 3. Add File Upload Limits
**Location:** `school_support_backend/settings.py`

**Add:**
```python
# File Upload Security
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_PERMISSIONS = 0o644
```

---

## 🟡 MEDIUM - Fix Before Production

### 4. Add Rate Limiting to All Sensitive Endpoints
**Location:** Create `core/throttling.py`

```python
from rest_framework.throttling import UserRateThrottle

class SensitiveEndpointThrottle(UserRateThrottle):
    rate = '10/hour'  # 10 requests per hour for sensitive operations
```

**Apply to:**
- Password change endpoint
- 2FA setup/disable
- User creation (admin only)
- Profile photo upload

### 5. Add SQL Injection Protection Middleware
**Location:** Create `core/security_middleware.py`

```python
import re
from django.http import HttpResponseBadRequest

class SQLInjectionProtectionMiddleware:
    SQL_PATTERNS = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bSELECT\b.*\bFROM\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(--|\#|\/\*)",
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.patterns = [re.compile(p, re.IGNORECASE) for p in self.SQL_PATTERNS]
    
    def __call__(self, request):
        # Check query params and body
        for pattern in self.patterns:
            if pattern.search(request.GET.urlencode()):
                return HttpResponseBadRequest("Invalid request")
            if request.body and pattern.search(request.body.decode('utf-8', errors='ignore')):
                return HttpResponseBadRequest("Invalid request")
        
        return self.get_response(request)
```

### 6. Add XSS Protection for User Inputs
**Location:** `users/serializers.py`

```python
import bleach

def clean_html(value):
    """Remove all HTML tags from user input"""
    return bleach.clean(value, tags=[], strip=True)

class UserSerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        return clean_html(value)
    
    def validate_bio(self, value):
        return clean_html(value)
```

### 7. Add CSRF Token Rotation
**Location:** `users/views/auth.py`

```python
from django.middleware.csrf import rotate_token

class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        rotate_token(request)  # Rotate CSRF token on login
        return super().post(request, *args, **kwargs)
```

### 8. Add Audit Logging for Security Events
**Location:** `core/audit.py`

**Add logging for:**
- Failed login attempts (already done ✅)
- 2FA setup/disable
- Password changes
- User role changes
- Profile photo uploads
- Admin actions (user creation, deletion)

---

## 🟢 LOW - Nice to Have

### 9. Add Content Security Policy (CSP)
**Location:** `school_support_backend/settings.py`

```python
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',  # Add django-csp
    # ... other middleware
]

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'",)
```

### 10. Add Security Headers Middleware
**Location:** Create `core/security_headers.py`

```python
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        return response
```

### 11. Add Password Breach Check
**Location:** Use haveibeenpwned API

```python
import requests

def check_password_breach(password):
    """Check if password appears in data breaches"""
    import hashlib
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    
    response = requests.get(f'https://api.pwnedpasswords.com/range/{prefix}')
    if suffix in response.text:
        return True  # Password breached
    return False
```

---

## Current Security Features ✅

1. ✅ JWT Authentication with httpOnly cookies
2. ✅ 2FA (TOTP) support
3. ✅ Rate limiting on login (10 attempts, 15min lockout)
4. ✅ Password strength validation (8+ chars, uppercase, lowercase, digit, special)
5. ✅ Session timeout (1 hour with 5min warning)
6. ✅ CSRF protection
7. ✅ HSTS headers (production only)
8. ✅ Audit logging for admin actions
9. ✅ Role-based access control (RBAC)
10. ✅ Token blacklisting on logout

---

## Priority Order

1. **TODAY:** Fix CRITICAL issues (#1, #2, #3)
2. **THIS WEEK:** Add file upload limits (#3)
3. **BEFORE PRODUCTION:** Fix all MEDIUM issues (#4-#8)
4. **OPTIONAL:** Implement LOW priority features (#9-#11)

---

## Testing Checklist

- [ ] Test with hardcoded secrets removed
- [ ] Test CORS with restricted origins
- [ ] Test file upload size limits
- [ ] Test rate limiting on all endpoints
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts in user inputs
- [ ] Test CSRF token rotation
- [ ] Verify all security headers present
- [ ] Test 2FA force reset with password
- [ ] Test session timeout behavior

---

## Production Deployment Checklist

- [ ] Set DEBUG=False
- [ ] Set strong SECRET_KEY (64+ random chars)
- [ ] Set strong DB_PASSWORD
- [ ] Configure ALLOWED_HOSTS
- [ ] Configure CORS_ALLOWED_ORIGINS
- [ ] Enable HTTPS (SECURE_SSL_REDIRECT=True)
- [ ] Set up Redis for caching
- [ ] Configure email backend (not console)
- [ ] Set up Sentry for error tracking
- [ ] Enable all security middleware
- [ ] Run security audit: `python manage.py check --deploy`
- [ ] Test all security features in staging
