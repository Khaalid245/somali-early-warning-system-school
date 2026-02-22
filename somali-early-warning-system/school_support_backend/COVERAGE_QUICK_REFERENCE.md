# Coverage Testing Quick Reference Guide

## 🎯 Goal: Increase Coverage from 39% → 70%+

---

## Priority Execution Order

### Phase 1: Security Foundation (Week 1)
```bash
# Run P0 tests (Critical Security)
pytest tests/test_core_permissions.py -v
pytest tests/test_core_idor_protection.py -v
pytest tests/test_attendance_views_coverage.py -v

# Check coverage after Phase 1
pytest tests/test_core_permissions.py tests/test_core_idor_protection.py tests/test_attendance_views_coverage.py --cov=core --cov=attendance --cov-report=term-missing
```

**Expected Coverage After Phase 1:**
- core/permissions.py: 95%
- core/idor_protection.py: 100%
- attendance/views.py: 90%

---

### Phase 2: Business Logic (Week 2)
```bash
# Run P1 tests (Business Logic)
pytest tests/test_attendance_serializers_coverage.py -v
pytest tests/test_students_views_coverage.py -v
pytest tests/test_classrooms_views_coverage.py -v

# Check coverage after Phase 2
pytest tests/test_attendance_serializers_coverage.py --cov=attendance.serializers --cov-report=term-missing
```

**Expected Coverage After Phase 2:**
- attendance/serializers.py: 95%
- students/views/: 85%

---

### Phase 3: Audit & User Management (Week 3)
```bash
# Run P1-P2 tests
pytest tests/test_core_views_coverage.py -v
pytest tests/test_users_views_coverage.py -v
pytest tests/test_auth_views_coverage.py -v
```

---

## Running All Coverage Tests

```bash
# Run all new coverage tests
pytest tests/test_*_coverage.py tests/test_core_permissions.py tests/test_core_idor_protection.py -v

# Generate full coverage report
pytest tests/ --cov=core --cov=attendance --cov=students --cov=users --cov-report=html --cov-report=term-missing

# Open HTML report
start htmlcov/index.html  # Windows
```

---

## Test File Mapping

| Test File | Target Module | Priority | Tests | Coverage Gain |
|-----------|---------------|----------|-------|---------------|
| test_core_permissions.py | core/permissions.py | P0 | 11 | +75% |
| test_core_idor_protection.py | core/idor_protection.py | P0 | 10 | +70% |
| test_attendance_views_coverage.py | attendance/views.py | P0 | 12 | +45% |
| test_attendance_serializers_coverage.py | attendance/serializers.py | P1 | 11 | +45% |
| test_students_views_coverage.py | students/views/* | P1 | 10 | +45% |
| test_classrooms_views_coverage.py | students/views/views_classrooms.py | P1 | 8 | +40% |
| test_core_views_coverage.py | core/views.py | P1 | 11 | +55% |
| test_users_views_coverage.py | users/views/users.py | P1 | 6 | +30% |
| test_auth_views_coverage.py | users/views/auth.py | P2 | 6 | +25% |

---

## Key Testing Patterns

### Pattern 1: Role-Based Queryset Filtering
```python
def test_admin_sees_all(self, api_client, admin_user):
    """Admin queryset returns all records"""
    api_client.force_authenticate(user=admin_user)
    response = api_client.get('/api/endpoint/')
    assert len(response.data['results']) >= 2

def test_teacher_sees_only_theirs(self, api_client, teacher_user):
    """Teacher queryset filters by teacher=user"""
    api_client.force_authenticate(user=teacher_user)
    response = api_client.get('/api/endpoint/')
    # Assert only their records returned
```

### Pattern 2: Permission Enforcement
```python
def test_non_admin_blocked(self, api_client, teacher_user):
    """403 when non-admin tries admin action"""
    api_client.force_authenticate(user=teacher_user)
    response = api_client.post('/api/admin-endpoint/', data)
    assert response.status_code == 403
    assert 'permission' in str(response.data).lower()
```

### Pattern 3: IDOR Protection
```python
def test_user_cannot_access_other_resource(self, api_client, teacher_user, other_teacher_resource):
    """403/404 when accessing resource not owned"""
    api_client.force_authenticate(user=teacher_user)
    response = api_client.get(f'/api/resource/{other_teacher_resource.id}/')
    assert response.status_code in [403, 404]
```

### Pattern 4: Validation Logic
```python
def test_duplicate_validation_error(self, api_client, teacher_user):
    """400 when duplicate detected"""
    api_client.force_authenticate(user=teacher_user)
    response = api_client.post('/api/endpoint/', duplicate_data)
    assert response.status_code == 400
    assert 'duplicate' in str(response.data).lower()
```

---

## Fixtures You'll Need

### User Fixtures
- `admin_user` - Admin role
- `teacher_user` - Teacher role
- `form_master_user` - Form master role
- `other_teacher_user` - For IDOR tests
- `other_form_master_user` - For IDOR tests

### Data Fixtures
- `classroom` - Classroom with form master
- `another_classroom` - For IDOR tests
- `student` - Student record
- `enrollment` - StudentEnrollment
- `subject` - Subject record
- `teaching_assignment` - Teacher-classroom-subject link

### Authentication Fixtures
- `api_client` - Unauthenticated client
- `authenticated_admin` - Pre-authenticated admin client
- `authenticated_teacher` - Pre-authenticated teacher client
- `authenticated_form_master` - Pre-authenticated form master client

---

## Common Assertions

### HTTP Status Codes
```python
assert response.status_code == 200  # Success
assert response.status_code == 201  # Created
assert response.status_code == 400  # Validation error
assert response.status_code == 401  # Unauthenticated
assert response.status_code == 403  # Permission denied
assert response.status_code == 404  # Not found
```

### Response Content
```python
assert 'error' in response.data
assert 'permission' in str(response.data).lower()
assert response.data['role'] == 'teacher'
assert len(response.data['results']) == 2
```

### Database State
```python
assert Model.objects.count() == 1
assert Model.objects.filter(field=value).exists()
assert not Model.objects.filter(field=value).exists()
```

---

## Debugging Failed Tests

### View Coverage Report
```bash
pytest tests/test_core_permissions.py --cov=core.permissions --cov-report=term-missing
```

Look for lines marked with `!` (not covered)

### Run Single Test
```bash
pytest tests/test_core_permissions.py::TestRequireRoleDecorator::test_unauthenticated_user_blocked -v
```

### Print Debug Info
```python
def test_something(self, api_client, teacher_user):
    response = api_client.get('/api/endpoint/')
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data}")
    assert response.status_code == 200
```

Run with `-s` flag:
```bash
pytest tests/test_file.py::test_something -s
```

---

## Coverage Metrics Interpretation

### Line Coverage
- **Measures:** Which lines of code were executed
- **Target:** 70%+ for backend modules

### Branch Coverage
- **Measures:** Which decision paths (if/else) were taken
- **Target:** 80%+ for security-critical modules

### What to Ignore
- Settings files (settings.py, test_settings.py)
- Migrations (*/migrations/*)
- __init__.py files
- Third-party code (venv, site-packages)

---

## Defense Talking Points

### "Why not 100% coverage?"
- **Industry Standard:** 70-80% is production-grade for backend APIs
- **Diminishing Returns:** Last 20% often tests framework internals, not business logic
- **Risk-Based:** We prioritized security boundaries and business logic over trivial code paths

### "What makes these tests valuable?"
- **Branch Coverage:** Tests decision points (if/else), not just line execution
- **Security Focus:** RBAC, IDOR, authentication boundaries
- **Real Vulnerabilities:** Tests actual attack vectors (unauthorized access, data leakage)
- **Production Patterns:** Mirrors SaaS security testing practices

### "How do these tests prevent bugs?"
- **Regression Prevention:** Catches when role checks are accidentally removed
- **Validation Enforcement:** Ensures business rules (no duplicates, all students present)
- **Access Control:** Prevents data leakage between users/roles
- **FERPA Compliance:** Validates student data access boundaries

---

## Next Steps After 70% Coverage

1. **Integration Tests:** Test multi-step workflows (create student → enroll → record attendance)
2. **Performance Tests:** Load testing for attendance recording at scale
3. **Security Scanning:** OWASP ZAP, Bandit for additional vulnerability detection
4. **E2E Tests:** Selenium/Playwright for frontend-backend integration

---

## Quick Commands Cheat Sheet

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific marker
pytest -m permissions -v
pytest -m idor -v
pytest -m attendance -v

# Run failed tests only
pytest --lf -v

# Run in parallel (faster)
pytest tests/ -n auto

# Generate coverage badge
coverage-badge -o coverage.svg -f
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'X'"
```bash
pip install -r requirements-test.txt
```

### "django.core.exceptions.ImproperlyConfigured"
```bash
# Ensure test_settings.py exists
# Check DJANGO_SETTINGS_MODULE in conftest.py
```

### "Database is locked"
```bash
# SQLite issue - tests running in parallel
pytest tests/ -n 0  # Disable parallel
```

### "Fixture 'X' not found"
```bash
# Check conftest.py has the fixture
# Ensure fixture name matches exactly
```

---

## Success Criteria

✅ **Phase 1 Complete:** core/permissions.py, core/idor_protection.py, attendance/views.py > 85%
✅ **Phase 2 Complete:** attendance/serializers.py, students/views/* > 80%
✅ **Phase 3 Complete:** core/views.py, users/views/* > 75%
✅ **Overall Target:** Backend coverage > 70%
✅ **All Tests Passing:** 85+ tests passing, <5% failure rate
✅ **Defense Ready:** Can explain every test's purpose and coverage contribution
