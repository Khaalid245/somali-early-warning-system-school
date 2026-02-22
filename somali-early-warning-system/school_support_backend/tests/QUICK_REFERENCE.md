# Testing Quick Reference

## Installation

```bash
pip install -r requirements-test.txt
```

## Run Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_auth.py

# Run specific test class
pytest tests/test_auth.py::TestAuthentication

# Run specific test method
pytest tests/test_auth.py::TestAuthentication::test_login_with_valid_credentials

# Run tests by marker
pytest -m auth
pytest -m rbac
pytest -m idor
pytest -m governance
pytest -m attendance
```

## Coverage

```bash
# Run with coverage
pytest --cov=.

# Generate HTML report
pytest --cov=. --cov-report=html

# View HTML report
start htmlcov/index.html  # Windows
open htmlcov/index.html   # Mac
xdg-open htmlcov/index.html  # Linux

# Show missing lines
pytest --cov=. --cov-report=term-missing
```

## Debugging

```bash
# Stop on first failure
pytest -x

# Show print statements
pytest -s

# Show local variables on failure
pytest -l

# Run last failed tests
pytest --lf

# Run failed tests first
pytest --ff
```

## Test Markers

```python
@pytest.mark.auth          # Authentication tests
@pytest.mark.rbac          # Role-based access control
@pytest.mark.idor          # IDOR protection
@pytest.mark.governance    # Admin governance
@pytest.mark.attendance    # Attendance business logic
```

## Common Fixtures

```python
# Users
admin_user
teacher_user
form_master_user
another_form_master

# Authenticated clients
authenticated_admin
authenticated_teacher
authenticated_form_master

# Data
classroom
another_classroom
student
enrollment
subject
teaching_assignment
```

## Expected Test Count

- Authentication: ~9 tests
- RBAC: ~19 tests
- IDOR: ~17 tests
- Governance: ~23 tests
- Attendance: ~18 tests

**Total: ~85 tests**

## Coverage Target

**70-80% meaningful coverage**

Excludes:
- Migrations
- Settings
- Third-party code
- Trivial methods (__str__, __repr__)

## Quick Health Check

```bash
# Run all tests and show summary
pytest --tb=short

# Expected output:
# ======================== 85 passed in 12.34s =========================
```

## Troubleshooting

### Import Errors
```bash
# Ensure you're in the right directory
cd school_support_backend

# Check Django settings
echo $DJANGO_SETTINGS_MODULE  # Should be: school_support_backend.settings
```

### Database Errors
```python
# Add db fixture to test
@pytest.mark.django_db
def test_something():
    pass
```

### Authentication Errors
```python
# Use force_authenticate
api_client.force_authenticate(user=admin_user)
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pytest --cov=. --cov-report=xml
```

## Defense Talking Points

1. **Security-focused**: Tests IDOR, RBAC, authentication
2. **Risk-based**: Prioritizes critical paths
3. **Industry-standard**: Uses pytest, fixtures, coverage
4. **Compliance-aware**: Tests audit logging, FERPA boundaries
5. **Production-ready**: CI/CD integration, automated quality gates
