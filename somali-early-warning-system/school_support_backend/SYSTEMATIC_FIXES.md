# 🎯 Systematic Fixes to Reach 65-70% Coverage

## Current Status
- ✅ 123 tests passing (87%)
- ❌ 18 tests failing
- 📊 55% coverage
- 🎯 Target: 136+ passing, 65-70% coverage

---

## Priority 1: Fix Structural Crash (select_related)

### Problem
```python
# WRONG - Student model has no direct 'classroom' FK
students = Student.objects.select_related('classroom')

# ERROR: Invalid field name(s) given in select_related: 'classroom'
```

### Root Cause
Student → StudentEnrollment → Classroom (many-to-many through table)

### Fix Location
Find all instances of:
```python
.select_related('classroom')
.prefetch_related('classroom')
```

Replace with:
```python
.prefetch_related('enrollments__classroom')
```

### Files to Check
- `students/views/views_students.py`
- `students/serializers.py`
- `dashboard/services.py`
- Any view that queries Student with classroom

### Impact
- Fixes 5+ test failures
- Removes all 500 errors in student endpoints

---

## Priority 2: Fix Permission Semantics

### Problem
```python
# WRONG - Returns 400 for permission issues
raise ValidationError("You are not assigned to this class")

# CORRECT - Returns 403 for permission issues
raise PermissionDenied("You are not assigned to this class")
```

### Fix Location: `attendance/views.py`

```python
# BEFORE
from rest_framework.exceptions import ValidationError

if not TeachingAssignment.objects.filter(...).exists():
    raise ValidationError("You are not assigned to this class/subject.")

# AFTER
from rest_framework.exceptions import PermissionDenied

if not TeachingAssignment.objects.filter(...).exists():
    raise PermissionDenied("You are not assigned to this class/subject.")
```

### Fix Location: `attendance/serializers.py`

```python
# BEFORE
if user.role != "teacher":
    raise ValidationError("Only teachers can record attendance.")

# AFTER
if user.role != "teacher":
    raise PermissionDenied("Only teachers can record attendance.")
```

### Impact
- Fixes 3-5 RBAC tests
- Fixes attendance permission tests
- Proper HTTP semantics (403 vs 400)

---

## Priority 3: Fix IDOR Protection in Views

### Problem
Views don't filter by ownership - IDOR vulnerability

### Fix: Add queryset filtering in detail views

#### File: `students/views/views_classrooms.py`

```python
class ClassroomDetailView(generics.RetrieveAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """IDOR Protection: Filter by user role"""
        user = self.request.user
        
        if user.role == 'admin':
            return Classroom.objects.all()
        
        if user.role == 'form_master':
            return Classroom.objects.filter(form_master=user)
        
        if user.role == 'teacher':
            # Teachers can see classrooms they teach
            return Classroom.objects.filter(
                teaching_assignments__teacher=user
            ).distinct()
        
        return Classroom.objects.none()
```

#### File: `alerts/views.py`

```python
class AlertDetailView(generics.RetrieveAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """IDOR Protection: Filter by assignment"""
        user = self.request.user
        
        if user.role == 'admin':
            return Alert.objects.all()
        
        if user.role == 'form_master':
            return Alert.objects.filter(assigned_to=user)
        
        if user.role == 'teacher':
            return Alert.objects.filter(
                subject__assignments__teacher=user
            )
        
        return Alert.objects.none()
```

#### File: `interventions/views.py`

```python
class InterventionCaseDetailView(generics.RetrieveAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """IDOR Protection: Filter by assignment"""
        user = self.request.user
        
        if user.role == 'admin':
            return InterventionCase.objects.all()
        
        if user.role == 'form_master':
            return InterventionCase.objects.filter(assigned_to=user)
        
        return InterventionCase.objects.none()
```

### Impact
- Fixes 5+ IDOR tests
- Prevents horizontal privilege escalation
- Production-ready security

---

## Priority 4: Fix Email Normalization

### File: `users/managers.py`

```python
from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):
    def normalize_email(self, email):
        """Normalize email: lowercase and strip whitespace"""
        email = super().normalize_email(email)
        return email.lower().strip()
    
    def create_user(self, email, name, role, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
```

### Impact
- Fixes duplicate email edge cases
- Case-insensitive email validation
- Whitespace handling

---

## Priority 5: Fix Missing @pytest.mark.django_db

### File: `tests/test_auth.py`

Add to any test that accesses database:

```python
@pytest.mark.django_db
class TestAuthentication:
    # All tests here
    pass
```

Or add to individual tests:

```python
@pytest.mark.django_db
def test_login_with_valid_credentials(self, api_client, admin_user):
    # test code
```

### Impact
- Fixes database access errors
- Ensures test isolation

---

## Implementation Order

### Step 1: Fix select_related (30 minutes)
```bash
# Search for the issue
grep -r "select_related('classroom')" .

# Fix each occurrence
# Replace with: prefetch_related('enrollments__classroom')
```

### Step 2: Fix PermissionDenied (15 minutes)
```bash
# In attendance/views.py and attendance/serializers.py
# Replace ValidationError with PermissionDenied for auth checks
```

### Step 3: Add IDOR queryset filtering (45 minutes)
```bash
# Add get_queryset() to:
# - ClassroomDetailView
# - AlertDetailView  
# - InterventionCaseDetailView
```

### Step 4: Fix email normalization (10 minutes)
```bash
# Update users/managers.py normalize_email method
```

### Step 5: Add @pytest.mark.django_db (5 minutes)
```bash
# Add to test classes that need it
```

---

## Expected Results After Fixes

### Test Results
- **136+ tests passing** (96%+)
- **5 or fewer failures**
- Clean HTTP semantics

### Coverage
- **62-67% coverage**
- All critical paths covered
- Security boundaries validated

### Quality Improvements
- ✅ IDOR protection in place
- ✅ Proper HTTP status codes
- ✅ No structural crashes
- ✅ Email validation robust
- ✅ Test isolation correct

---

## Quick Fix Commands

```bash
# 1. Run tests to see current failures
python -m pytest tests/ -v --tb=short

# 2. After each fix, run specific test category
python -m pytest tests/test_idor.py -v
python -m pytest tests/test_rbac.py -v
python -m pytest tests/test_attendance.py -v

# 3. Check coverage after all fixes
python -m pytest tests/ --cov=. --cov-report=html
start htmlcov/index.html
```

---

## Files to Modify

1. **students/views/views_students.py** - Fix select_related
2. **students/serializers.py** - Fix select_related
3. **dashboard/services.py** - Fix select_related
4. **attendance/views.py** - Change ValidationError → PermissionDenied
5. **attendance/serializers.py** - Change ValidationError → PermissionDenied
6. **students/views/views_classrooms.py** - Add get_queryset() IDOR protection
7. **alerts/views.py** - Add get_queryset() IDOR protection
8. **interventions/views.py** - Add get_queryset() IDOR protection
9. **users/managers.py** - Fix normalize_email
10. **tests/test_auth.py** - Add @pytest.mark.django_db if needed

---

## Validation Checklist

After fixes, verify:

- [ ] No 500 errors in student endpoints
- [ ] Attendance returns 403 (not 400) for unauthorized
- [ ] Form masters cannot access other classrooms (403/404)
- [ ] Duplicate emails rejected (case-insensitive)
- [ ] All tests have database access
- [ ] Coverage report shows 62-67%
- [ ] 136+ tests passing

---

## Defense Talking Points After Fixes

> "I implemented 141 comprehensive tests achieving 65% coverage with 136 tests passing. I fixed structural issues (select_related), implemented IDOR protection via queryset filtering, corrected HTTP semantics (403 vs 400), and ensured robust email validation. This demonstrates production-ready backend engineering."

**Key achievements:**
- ✅ 96%+ test pass rate
- ✅ 65% coverage on critical paths
- ✅ IDOR protection implemented
- ✅ Proper HTTP status codes
- ✅ No structural crashes
- ✅ Industry-standard practices

---

## Time Estimate

- **Total time:** 2 hours
- **Result:** Production-ready test suite
- **Coverage:** 65-70%
- **Pass rate:** 96%+

**You'll be ready to defend with confidence!** 🎓
