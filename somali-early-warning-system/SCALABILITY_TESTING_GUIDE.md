# Scalability Testing Guide

## How to Verify All Scalability Improvements

### ✅ 1. Verify Database Indexes Are Applied

**Check if migration exists:**
```bash
cd school_support_backend
python manage.py showmigrations core
```

**Expected output:**
```
core
 [X] 0001_initial
 [X] 0002_add_performance_indexes
```

**Apply if not applied:**
```bash
python manage.py migrate core 0002_add_performance_indexes
```

**Verify indexes in MySQL:**
```sql
USE school_support_db;

-- Check intervention case indexes
SHOW INDEX FROM interventions_interventioncase;

-- Check alert indexes
SHOW INDEX FROM alerts_alert;

-- Check audit log indexes
SHOW INDEX FROM core_auditlog;

-- Check student indexes
SHOW INDEX FROM students_student;
```

**Expected indexes:**
- `idx_case_assigned_status_created` on interventioncase
- `idx_alert_assigned_status_date` on alert
- `idx_audit_user_timestamp` on auditlog
- `idx_student_classroom_active` on student

---

### ✅ 2. Test Database Connection Pooling

**Check settings.py has pooling config:**
```bash
cd school_support_backend
type school_support_backend\settings.py | findstr CONN_MAX_AGE
```

**Expected output:**
```python
'CONN_MAX_AGE': 600,
```

**Test with concurrent requests:**
```bash
# Install Apache Bench (comes with Apache)
# Or use Python script below
```

**Create test script `test_pooling.py`:**
```python
import requests
import threading
import time

def make_request():
    try:
        response = requests.get('http://127.0.0.1:8000/api/interventions/dashboard/')
        print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

# Simulate 50 concurrent users
threads = []
start = time.time()
for i in range(50):
    t = threading.Thread(target=make_request)
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print(f"Completed in {time.time() - start:.2f} seconds")
```

**Run test:**
```bash
python test_pooling.py
```

**Expected:** All requests complete without "Too many connections" error

---

### ✅ 3. Test Query Optimization (N+1 Prevention)

**Enable Django Debug Toolbar or use logging:**

**Add to settings.py temporarily:**
```python
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

**Make dashboard request and count queries:**
```bash
python manage.py shell
```

```python
from django.test.utils import override_settings
from django.db import connection
from django.test import RequestFactory
from interventions.views import FormMasterDashboardView

# Reset query log
connection.queries_log.clear()

# Make request
factory = RequestFactory()
request = factory.get('/api/interventions/dashboard/')
view = FormMasterDashboardView.as_view()

# Count queries
print(f"Total queries: {len(connection.queries)}")
for query in connection.queries:
    print(query['sql'][:100])
```

**Expected:** 
- WITHOUT optimization: 50+ queries for 20 cases
- WITH optimization: 5-10 queries total

---

### ✅ 4. Test Load with k6

**Install k6:**
```bash
# Windows (using Chocolatey)
choco install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

**Run load test:**
```bash
cd somali-early-warning-system
k6 run load-test.js
```

**Expected output:**
```
✓ status is 200
✓ response time < 500ms

checks.........................: 100.00% ✓ 1200 ✗ 0
http_req_duration..............: avg=150ms p95=450ms
http_reqs......................: 1200
```

**If k6 not available, use Python alternative:**
```python
# test_load.py
import requests
import time
import statistics

def test_endpoint(url, num_requests=100):
    times = []
    for i in range(num_requests):
        start = time.time()
        response = requests.get(url)
        duration = (time.time() - start) * 1000
        times.append(duration)
        if i % 10 == 0:
            print(f"Request {i}: {duration:.0f}ms")
    
    print(f"\nResults for {num_requests} requests:")
    print(f"Average: {statistics.mean(times):.0f}ms")
    print(f"P95: {statistics.quantiles(times, n=20)[18]:.0f}ms")
    print(f"Max: {max(times):.0f}ms")

# Test dashboard
test_endpoint('http://127.0.0.1:8000/api/interventions/dashboard/')
```

---

### ✅ 5. Test Pagination (Frontend)

**Open browser console on Form Master dashboard:**
```javascript
// Check pagination is working
console.log(document.querySelector('[aria-label="Students needing support table"]'));

// Should see "Page X of Y" if more than 20 students
```

**Or check React DevTools:**
- Find `FormMasterDashboardContent` component
- Check `studentsPagination` state
- Verify `itemsPerPage: 20`

---

### ✅ 6. Test Audit Log Performance

**Create test data:**
```bash
python manage.py shell
```

```python
from core.models import AuditLog
from django.contrib.auth import get_user_model
import random
from datetime import datetime, timedelta

User = get_user_model()
user = User.objects.first()

# Create 10,000 audit logs
logs = []
for i in range(10000):
    logs.append(AuditLog(
        user=user,
        action=random.choice(['LOGIN', 'CASE_CREATED', 'ALERT_RESOLVED']),
        details={'test': i},
        timestamp=datetime.now() - timedelta(days=random.randint(0, 365))
    ))

AuditLog.objects.bulk_create(logs, batch_size=1000)
print(f"Created {AuditLog.objects.count()} audit logs")
```

**Test query performance:**
```python
import time
from core.models import AuditLog

# Without index (if you want to compare)
start = time.time()
logs = list(AuditLog.objects.filter(user=user).order_by('-timestamp')[:100])
print(f"Query took: {(time.time() - start)*1000:.0f}ms")
```

**Expected:**
- WITH indexes: <100ms for 10,000 records
- WITHOUT indexes: >1000ms

---

### ✅ 7. Verify All Files Exist

**Run this checklist:**
```bash
cd somali-early-warning-system

# Backend scalability files
dir school_support_backend\core\migrations\0002_add_performance_indexes.py
dir school_support_backend\DATABASE_SCALING_CONFIG.py
dir school_support_backend\OPTIMIZED_QUERIES.py
dir school_support_backend\AUDIT_LOG_PARTITIONING.py

# Frontend scalability files
dir school_support_frontend\src\hooks\usePagination.js
dir school_support_frontend\src\hooks\useSmartPolling.js
dir school_support_frontend\src\utils\reliability.js

# Testing files
dir load-test.js
dir SCALABILITY_ANSWERS.md
```

**All files should exist.**

---

## Quick Verification Checklist

| Test | Command | Expected Result |
|------|---------|----------------|
| ✅ Indexes applied | `python manage.py showmigrations core` | `[X] 0002_add_performance_indexes` |
| ✅ Connection pooling | Check settings.py | `CONN_MAX_AGE: 600` |
| ✅ Query count | Django shell test | <10 queries for dashboard |
| ✅ Load test | `k6 run load-test.js` | p95 < 500ms |
| ✅ Pagination | Browser console | 20 items per page |
| ✅ Audit logs | Create 10k logs | Query < 100ms |

---

## Performance Benchmarks to Achieve

Based on SCALABILITY_ANSWERS.md:

- **Dashboard load:** 150ms (was 10s) = 66x faster
- **Case list:** 80ms (was 5s) = 62x faster  
- **Alert list:** 60ms (was 3s) = 50x faster
- **Audit logs:** 200ms (was 8s) = 40x faster

---

## If Tests Fail

### Indexes not applied:
```bash
python manage.py migrate core
```

### Connection pooling not working:
Add to `settings.py`:
```python
DATABASES['default']['CONN_MAX_AGE'] = 600
```

### Queries still slow:
Check `OPTIMIZED_QUERIES.py` is imported in views.py

### Load test fails:
Ensure backend is running: `python manage.py runserver`

---

## Next Steps After Testing

1. ✅ Run all tests above
2. ✅ Document results in a new file `TEST_RESULTS.md`
3. ✅ Compare with benchmarks in `SCALABILITY_ANSWERS.md`
4. ✅ If any test fails, apply the fix and re-test
