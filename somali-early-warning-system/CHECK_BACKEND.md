# Backend 500 Error - Quick Fix

## Issue
Dashboard returns 500 error after code changes

## Solution

### 1. Restart Django Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
cd school_support_backend
python manage.py runserver
```

### 2. Check for Errors
Look for error in terminal when server starts

### 3. If Import Error
The changes added `invalidate_teacher_cache` import in `attendance/views.py`

Make sure this line exists in `attendance/views.py`:
```python
from dashboard.cache_utils import invalidate_teacher_cache
```

### 4. Clear Cache (if needed)
```python
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
>>> exit()
```

### 5. Test Dashboard
```bash
curl http://127.0.0.1:8000/api/dashboard/
```

## Most Likely Cause
Server needs restart after code changes. Django doesn't auto-reload for some file types.

**Action**: Just restart the Django server
