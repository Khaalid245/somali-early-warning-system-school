# Quick Start: Testing Security Improvements

## Step 1: Start Django Server

Open a terminal and run:

```bash
cd somali-early-warning-system\school_support_backend
python manage.py runserver
```

You should see:
```
Django version 5.1.4, using settings 'school_support_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

## Step 2: Run Security Tests

Open a **NEW** terminal (keep the server running) and run:

```bash
cd somali-early-warning-system\school_support_backend
python test_security_improvements.py
```

Press Enter when prompted.

## Expected Results

### ✅ Test 1: Replay Protection
```
1. First request with nonce...
   Status: 401 (Expected: 401 - login fails but passes middleware)

2. Replaying same nonce (should be blocked)...
   Status: 409 - PASS: Replay blocked!
   Response: {'error': 'Duplicate request detected. Request already processed.'}
```

### ✅ Test 2: Rate Limiting
```
Making 11 login attempts...
   Request  1: Status 401 - Unauthorized (expected)
   Request  2: Status 401 - Unauthorized (expected)
   ...
   Request 10: Status 401 - Unauthorized (expected)
   Request 11: Status 429 - RATE LIMITED!
   Response: {'detail': 'Request was throttled. Expected available in X seconds.'}

   PASS: Rate limiting working! Blocked after 10 requests
```

### 📊 Test Summary
```
[+] Replay Protection: PASS
[+] Rate Limiting: PASS

Total: 2/2 tests passed

All security improvements are working correctly!
```

## Troubleshooting

### Error: "Cannot connect to Django server"
- Make sure Django server is running in another terminal
- Check that it's running on http://127.0.0.1:8000/

### Error: "ModuleNotFoundError: No module named 'pyotp'"
```bash
cd school_support_backend
pip install -r requirements.txt
```

### Server won't start
```bash
cd school_support_backend
python manage.py check
```

Fix any errors shown, then try again.

## What Was Implemented

### 1. Replay Protection Middleware ✅
- **File**: `core/replay_protection.py`
- **Enabled in**: `settings.py` line 86
- **How it works**: 
  - Validates X-Request-Nonce header (must be unique)
  - Validates X-Request-Timestamp header (must be < 5 minutes old)
  - Stores nonces in cache for 10 minutes
  - Blocks duplicate requests with 409 Conflict
  - Blocks expired requests with 400 Bad Request

### 2. Rate Limiting ✅
- **File**: `core/throttling.py`
- **Applied to**:
  - Login endpoint: 10 attempts/hour
  - Dashboard endpoint: 100 requests/hour
  - User management: 10 operations/hour
  - File uploads: 10 uploads/hour
- **How it works**:
  - Tracks requests by IP address (anonymous) or user ID (authenticated)
  - Returns 429 Too Many Requests when limit exceeded
  - Resets after 1 hour

## Next Steps

After confirming tests pass, you can proceed with:

1. **Data Archival Strategy** - Prevent database bloat
2. **API Documentation** - Add Swagger/OpenAPI docs
3. **Integration Tests** - End-to-end workflow testing
4. **Frontend Tests** - Jest/React Testing Library
5. **Monitoring** - Enable Sentry error tracking
6. **Data Encryption** - Encrypt sensitive fields

See `IMPLEMENTATION_PROGRESS.md` for details.
