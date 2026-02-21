# Security Fixes Implementation

## ✅ 1. JWT Tokens in httpOnly Cookies (XSS Protection)

**Problem:** Tokens stored in localStorage are vulnerable to XSS attacks.

**Solution:**
- Backend: `core/jwt_cookie_auth.py` - Custom authentication reads from httpOnly cookies
- Settings: `AUTH_COOKIE_HTTP_ONLY: True` prevents JavaScript access
- Settings: `AUTH_COOKIE_SECURE: True` enforces HTTPS in production
- Settings: `AUTH_COOKIE_SAMESITE: 'Lax'` prevents CSRF attacks

**Frontend Impact:**
- Remove `localStorage.setItem('token')` calls
- Use `credentials: 'include'` in fetch requests
- Cookies are automatically sent with requests

**Testing:**
```javascript
// Old (VULNERABLE):
localStorage.setItem('access_token', token);

// New (SECURE):
// Token automatically stored in httpOnly cookie by backend
fetch('/api/endpoint', { credentials: 'include' });
```

---

## ✅ 2. Replay Attack Prevention

**Problem:** PATCH requests can be replayed to duplicate actions.

**Solution:**
- Middleware: `core/replay_protection.py` validates request nonces
- Each request includes unique nonce + timestamp
- Nonces cached for 10 minutes to detect duplicates
- Requests older than 5 minutes are rejected

**Headers Required:**
```
X-Request-Nonce: uuid-v4-string
X-Request-Timestamp: unix-timestamp-ms
```

**Frontend Implementation:**
```javascript
import { generateReplayProtectionHeaders } from '@/utils/replayProtection';

const headers = {
  ...generateReplayProtectionHeaders(),
  'Content-Type': 'application/json'
};
```

**Error Responses:**
- `400`: Request expired (>5 minutes old)
- `409`: Duplicate request detected (nonce reused)

---

## ✅ 3. IDOR Protection (Insecure Direct Object Reference)

**Problem:** Users can access `/api/interventions/cases/999/` by changing URL.

**Solution:**
- Mixin: `core/idor_protection.py` validates resource ownership
- Applied to: `InterventionCaseDetailView`, `AlertDetailView`
- Checks `assigned_to` field matches authenticated user
- Admin role bypasses checks (can access all resources)

**Protection Logic:**
```python
class IDORProtectionMixin:
    def get_object(self):
        obj = super().get_object()
        if user.role != 'admin' and obj.assigned_to != user:
            raise PermissionDenied("Access denied")
        return obj
```

**Example:**
- Form Master A tries to access Case 999 (assigned to Form Master B)
- Response: `403 Forbidden - You don't have permission to access this case`

---

## Security Checklist

| Security Issue | Status | Implementation |
|----------------|--------|----------------|
| ✅ HTTPS enforced | Fixed | `SECURE_SSL_REDIRECT = True` |
| ✅ JWT in httpOnly cookies | Fixed | `JWTCookieAuthentication` |
| ✅ Refresh token rotation | Fixed | `ROTATE_REFRESH_TOKENS: True` |
| ✅ Replay attack prevention | Fixed | `ReplayAttackProtectionMiddleware` |
| ✅ IDOR protection | Fixed | `IDORProtectionMixin` |
| ✅ CSRF protection | Fixed | `AUTH_COOKIE_SAMESITE: 'Lax'` |

---

## Testing Commands

### 1. Test httpOnly Cookie:
```bash
# Login and check cookies
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' \
  -c cookies.txt

# Verify cookie is httpOnly
cat cookies.txt | grep httpOnly
```

### 2. Test Replay Protection:
```bash
# First request (should succeed)
curl -X PATCH http://localhost:8000/api/interventions/cases/1/ \
  -H "X-Request-Nonce: test-nonce-123" \
  -H "X-Request-Timestamp: $(date +%s)000" \
  -b cookies.txt

# Second request with same nonce (should fail with 409)
curl -X PATCH http://localhost:8000/api/interventions/cases/1/ \
  -H "X-Request-Nonce: test-nonce-123" \
  -H "X-Request-Timestamp: $(date +%s)000" \
  -b cookies.txt
```

### 3. Test IDOR Protection:
```bash
# Login as Form Master A
# Try to access case assigned to Form Master B
curl http://localhost:8000/api/interventions/cases/999/ \
  -b cookies.txt

# Expected: 403 Forbidden
```

---

## Migration Guide for Frontend

### Before (VULNERABLE):
```javascript
// Login
const response = await api.post('/auth/login', credentials);
localStorage.setItem('access_token', response.data.access);

// API call
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
};
```

### After (SECURE):
```javascript
// Login (token automatically stored in httpOnly cookie)
await api.post('/auth/login', credentials, { withCredentials: true });

// API call (cookie automatically sent)
import { secureApiCall } from '@/utils/replayProtection';
const data = await secureApiCall('PATCH', '/api/cases/1/', { status: 'closed' });
```

---

## Production Deployment Checklist

- [ ] Install `uuid` package: `npm install uuid`
- [ ] Update all API calls to use `credentials: 'include'`
- [ ] Remove all `localStorage.setItem('token')` calls
- [ ] Add replay protection headers to state-changing requests
- [ ] Test IDOR protection with multiple user accounts
- [ ] Verify HTTPS is enforced in production
- [ ] Monitor for 409 errors (replay attempts) in logs
