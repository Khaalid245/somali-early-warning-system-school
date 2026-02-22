# Pytest Cache Cleanup - test_risk.py

## Issue
Pytest failed with:
```
ImportError: cannot import name 'RiskAssessment' from risk.models
In risk/test_risk.py line 6
```

Even though `risk/test_risk.py` was already deleted.

## Root Cause
**Python bytecode cache (.pyc files)** - Pytest was loading the cached compiled version of the deleted test file.

## Files Found and Deleted

1. **risk/test_risk.py** - Already deleted (deprecated test file)
2. **risk/__pycache__/test_risk.cpython-312-pytest-9.0.2.pyc** - Cached bytecode file

## Resolution

### Step 1: Delete cached .pyc file
```bash
del risk\__pycache__\test_risk.cpython-312-pytest-9.0.2.pyc
```

### Step 2: Clear entire __pycache__ directory
```bash
rmdir /s /q risk\__pycache__
```

## Why This Happened

Python caches compiled bytecode (.pyc files) in `__pycache__` directories for performance. When you delete a .py file, the .pyc file remains and pytest can still try to import it.

## Prevention

Always clear pytest cache after deleting test files:

```bash
# Clear pytest cache
pytest --cache-clear

# Or delete __pycache__ directories
find . -type d -name __pycache__ -exec rm -rf {} +  # Unix
for /d /r %d in (__pycache__) do @if exist "%d" rd /s /q "%d"  # Windows
```

## Verification

```bash
# Verify file is gone
dir risk\test_risk.py
# Output: File Not Found ✅

# Verify cache is cleared
dir risk\__pycache__\test_risk*
# Output: File Not Found ✅
```

## Status
✅ **RESOLVED** - Both source file and cached bytecode removed

## Related Documentation
- `RISK_TEST_CLEANUP.md` - Original cleanup documentation
