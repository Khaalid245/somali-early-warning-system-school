# Test Coverage Gap Analysis & Strategic Test Plan

## Executive Summary
Current coverage: **39%** → Target: **70%+**

This document provides a risk-based testing strategy targeting critical security boundaries, RBAC enforcement, and business logic validation.

---

## Priority Matrix (Test First → Last)

### 🔴 CRITICAL (P0) - Security & Access Control
1. **core/permissions.py** - Decorator-based RBAC enforcement
2. **core/idor_protection.py** - IDOR prevention mixin
3. **attendance/views.py** - Teacher assignment validation
4. **students/views/** - Multi-role queryset filtering

### 🟡 HIGH (P1) - Business Logic & Validation
5. **attendance/serializers.py** - Duplicate prevention, enrollment validation
6. **core/views.py** - Audit log filtering, role-based access
7. **users/views/users.py** - Profile update authorization

### 🟢 MEDIUM (P2) - Edge Cases & Error Handling
8. **users/views/auth.py** - Cookie handling, token refresh edge cases

---

## Detailed Test Plans by Module

### 1. core/permissions.py (CRITICAL)

**Uncovered Branches:**
- Unauthenticated access to @require_role decorated views
- Non-admin accessing admin-only resources via @validate_resource_ownership
- Resource not found in ownership validation
- Owner field mismatch scenarios

**Test Strategy:**
```python
# tests/test_core_permissions.py

@pytest.mark.permissions
class TestRequireRoleDecorator:
    """Test @require_role decorator enforcement"""
    
    def test_unauthenticated_user_blocked(self, api_client):
        """401 when no auth token provided"""
        # Simulates: if not request.user.is_authenticated
        
    def test_wrong_role_blocked(self, api_client, teacher_user):
        """403 when teacher tries admin-only endpoint"""
        # Simulates: if request.user.role not in allowed_roles
        
    def test_correct_role_allowed(self, api_client, admin_user):
        """200 when admin accesses admin endpoint"""
        # Simulates: return view_func(request, *args, **kwargs)
        
    def test_multiple_allowed_roles(self, api_client, form_master_user):
        """200 when any allowed role accesses endpoint"""
        # Tests: @require_role('admin', 'form_master')

@pytest.mark.permissions
class TestValidateResourceOwnership:
    """Test @validate_resource_ownership decorator"""
    
    def test_non_owner_non_admin_blocked(self, api_client, teacher_user, other_teacher_alert):
        """403 when teacher tries to access another teacher's alert"""
        # Simulates: if owner != request.user and request.user.role != 'admin'
        
    def test_owner_allowed(self, api_client, teacher_user, teacher_alert):
        """200 when owner accesses their resource"""
        
    def test_admin_bypass_ownership(self, api_client, admin_user, teacher_alert):
        """200 when admin accesses any resource"""
        # Simulates: request.user.role == 'admin' bypass
        
    def test_resource_not_found(self, api_client, teacher_user):
        """404 when resource ID doesn't exist"""
        # Simulates: except model.DoesNotExist
```

**Expected Coverage Increase:** +15%

---

### 2. core/idor_protection.py (CRITICAL)

**Uncovered Branches:**
- Non-admin accessing InterventionCase not assigned to them
- Non-admin accessing Alert not assigned to them
- Admin bypass logic

**Test Strategy:**
```python
# tests/test_core_idor_protection.py

@pytest.mark.idor
class TestIDORProtectionMixin:
    """Test IDORProtectionMixin.get_object() enforcement"""
    
    def test_form_master_blocked_from_other_intervention(self, api_client, form_master_user, other_intervention):
        """403 when form master tries to access another's intervention case"""
        # Simulates: if obj.assigned_to != user (InterventionCase branch)
        
    def test_teacher_blocked_from_other_alert(self, api_client, teacher_user, other_teacher_alert):
        """403 when teacher tries to access another's alert"""
        # Simulates: if obj.assigned_to != user (Alert branch)
        
    def test_admin_accesses_any_intervention(self, api_client, admin_user, form_master_intervention):
        """200 when admin accesses any intervention"""
        # Simulates: if user.role == 'admin': return obj
        
    def test_admin_accesses_any_alert(self, api_client, admin_user, teacher_alert):
        """200 when admin accesses any alert"""
        
    def test_owner_accesses_own_intervention(self, api_client, form_master_user, form_master_intervention):
        """200 when form master accesses their intervention"""
        
    def test_owner_accesses_own_alert(self, api_client, teacher_user, teacher_alert):
        """200 when teacher accesses their alert"""
```

**Expected Coverage Increase:** +12%

---

### 3. attendance/views.py (CRITICAL)

**Uncovered Branches:**
- Non-teacher attempting to create attendance session
- Teacher not assigned to class/subject combination
- Duplicate session prevention
- Form master queryset filtering
- Admin queryset filtering

**Test Strategy:**
```python
# tests/test_attendance_views_coverage.py

@pytest.mark.attendance
class TestAttendanceSessionListCreateView:
    """Test queryset filtering and creation validation"""
    
    def test_admin_sees_all_sessions(self, api_client, admin_user, attendance_session):
        """Admin queryset returns all sessions"""
        # Simulates: if user.role == "admin"
        
    def test_teacher_sees_only_their_sessions(self, api_client, teacher_user, teacher_session, other_teacher_session):
        """Teacher queryset filters by teacher=user"""
        # Simulates: if user.role == "teacher"
        
    def test_form_master_sees_classroom_sessions(self, api_client, form_master_user, classroom_session):
        """Form master queryset filters by classroom__form_master=user"""
        # Simulates: if user.role == "form_master"
        
    def test_non_teacher_cannot_create_session(self, api_client, form_master_user, valid_session_data):
        """403 when non-teacher tries to create attendance"""
        # Simulates: if user.role != "teacher": raise PermissionDenied
        
    def test_teacher_not_assigned_to_class_blocked(self, api_client, teacher_user, unassigned_class_data):
        """403 when teacher not in TeachingAssignment"""
        # Simulates: if not TeachingAssignment.objects.filter(...).exists()
        
    def test_duplicate_session_blocked(self, api_client, teacher_user, existing_session_data):
        """403 when session already exists for class/subject/date"""
        # Simulates: if AttendanceSession.objects.filter(...).exists()
        
    def test_valid_session_creation_triggers_risk_update(self, api_client, teacher_user, valid_session_data, mocker):
        """201 and calls update_risk_after_session()"""
        # Simulates: session = serializer.save(); update_risk_after_session(session)
        mock_risk = mocker.patch('attendance.views.update_risk_after_session')
        # Assert mock_risk.called
```

**Expected Coverage Increase:** +18%

---

### 4. attendance/serializers.py (HIGH)

**Uncovered Branches:**
- Non-teacher validation in serializer
- Teacher not assigned validation
- Duplicate student detection
- Enrolled students mismatch (missing students)
- Enrolled students mismatch (extra students)

**Test Strategy:**
```python
# tests/test_attendance_serializers_coverage.py

@pytest.mark.serializers
class TestAttendanceSessionSerializer:
    """Test validation logic branches"""
    
    def test_non_teacher_validation_error(self, api_client, form_master_user, valid_session_data):
        """ValidationError when non-teacher submits"""
        # Simulates: if user.role != "teacher": raise PermissionDenied
        
    def test_teacher_not_assigned_validation_error(self, api_client, teacher_user, unassigned_data):
        """ValidationError when teacher not in TeachingAssignment"""
        # Simulates: if not TeachingAssignment.objects.filter(...).exists()
        
    def test_duplicate_students_validation_error(self, api_client, teacher_user, duplicate_student_data):
        """ValidationError when same student appears twice"""
        # Simulates: if len(submitted_ids) != len(submitted_set)
        
    def test_missing_students_validation_error(self, api_client, teacher_user, incomplete_data):
        """ValidationError when not all enrolled students included"""
        # Simulates: if submitted_set != enrolled_set (missing students)
        
    def test_extra_students_validation_error(self, api_client, teacher_user, extra_student_data):
        """ValidationError when non-enrolled student included"""
        # Simulates: if submitted_set != enrolled_set (extra students)
        
    def test_valid_data_creates_session_and_records(self, api_client, teacher_user, valid_complete_data):
        """201 and creates AttendanceSession + AttendanceRecords"""
        # Simulates: session = AttendanceSession.objects.create(...); AttendanceRecord.objects.create(...)
```

**Expected Coverage Increase:** +14%

---

### 5. students/views/views_students.py (CRITICAL)

**Uncovered Branches:**
- Admin queryset (all students)
- Form master queryset (their classroom students)
- Teacher queryset (classes they teach)
- Classroom filter query param
- Non-admin create/update/delete attempts

**Test Strategy:**
```python
# tests/test_students_views_coverage.py

@pytest.mark.students
class TestStudentListCreateView:
    """Test role-based queryset filtering"""
    
    def test_admin_sees_all_students(self, api_client, admin_user, student1, student2):
        """Admin queryset returns all students"""
        # Simulates: if user.role == "admin": return queryset
        
    def test_form_master_sees_only_classroom_students(self, api_client, form_master_user, classroom_student, other_student):
        """Form master queryset filters by enrollments__classroom__form_master"""
        # Simulates: if user.role == "form_master"
        
    def test_teacher_sees_only_taught_students(self, api_client, teacher_user, taught_student, other_student):
        """Teacher queryset filters by teaching_assignments"""
        # Simulates: if user.role == "teacher"
        
    def test_classroom_filter_applied(self, api_client, admin_user, classroom1_student, classroom2_student):
        """?classroom=X filters by enrollments__classroom_id"""
        # Simulates: if classroom_id: queryset = queryset.filter(...)
        
    def test_non_admin_cannot_create_student(self, api_client, teacher_user, student_data):
        """403 when non-admin tries to create"""
        # Simulates: if self.request.user.role != "admin": raise PermissionDenied

@pytest.mark.students
class TestStudentDetailView:
    """Test IDOR protection and update/delete authorization"""
    
    def test_form_master_cannot_access_other_classroom_student(self, api_client, form_master_user, other_classroom_student):
        """404 when form master tries to access student outside their classroom"""
        # Simulates: queryset.filter(classroom__form_master=user) → empty
        
    def test_teacher_cannot_access_untaught_student(self, api_client, teacher_user, untaught_student):
        """404 when teacher tries to access student they don't teach"""
        
    def test_non_admin_cannot_update_student(self, api_client, teacher_user, student):
        """403 when non-admin tries to update"""
        # Simulates: if self.request.user.role != "admin": raise PermissionDenied
        
    def test_non_admin_cannot_delete_student(self, api_client, form_master_user, student):
        """403 when non-admin tries to delete"""
```

**Expected Coverage Increase:** +16%

---

### 6. students/views/views_classrooms.py (CRITICAL)

**Uncovered Branches:**
- Admin/form master/teacher queryset filtering
- Non-admin create/update/delete attempts
- IDOR protection in get_queryset()

**Test Strategy:**
```python
# tests/test_classrooms_views_coverage.py

@pytest.mark.classrooms
class TestClassroomListCreateView:
    """Test role-based queryset filtering"""
    
    def test_admin_sees_all_classrooms(self, api_client, admin_user, classroom1, classroom2):
        """Admin queryset returns all classrooms"""
        
    def test_form_master_sees_only_their_classroom(self, api_client, form_master_user, their_classroom, other_classroom):
        """Form master queryset filters by form_master=user"""
        
    def test_teacher_sees_only_taught_classrooms(self, api_client, teacher_user, taught_classroom, other_classroom):
        """Teacher queryset filters by teaching_assignments__teacher"""
        
    def test_non_admin_cannot_create_classroom(self, api_client, teacher_user, classroom_data):
        """403 when non-admin tries to create"""

@pytest.mark.classrooms
class TestClassroomDetailView:
    """Test IDOR protection via get_queryset()"""
    
    def test_form_master_cannot_access_other_classroom(self, api_client, form_master_user, other_classroom):
        """404 when form master tries to access another's classroom"""
        # Simulates: get_queryset().filter(form_master=user) → empty
        
    def test_teacher_cannot_access_untaught_classroom(self, api_client, teacher_user, untaught_classroom):
        """404 when teacher tries to access classroom they don't teach"""
        
    def test_non_admin_cannot_update_classroom(self, api_client, form_master_user, classroom):
        """403 when non-admin tries to update"""
        
    def test_non_admin_cannot_delete_classroom(self, api_client, teacher_user, classroom):
        """403 when non-admin tries to delete"""
```

**Expected Coverage Increase:** +13%

---

### 7. core/views.py (HIGH)

**Uncovered Branches:**
- get_client_ip() with X-Forwarded-For header
- get_client_ip() without X-Forwarded-For
- Audit log filtering (user_id, action, date range)
- Pagination logic
- Non-admin/non-form-master accessing audit logs
- Non-admin exporting audit logs

**Test Strategy:**
```python
# tests/test_core_views_coverage.py

@pytest.mark.audit
class TestAuditLogViews:
    """Test audit log creation, filtering, and export"""
    
    def test_log_audit_creates_entry(self, api_client, teacher_user):
        """201 and creates AuditLog with IP/user agent"""
        # Simulates: AuditLog.objects.create(...)
        
    def test_log_audit_extracts_forwarded_ip(self, api_client, teacher_user):
        """Extracts IP from X-Forwarded-For header"""
        # Simulates: x_forwarded_for.split(',')[0]
        
    def test_log_audit_uses_remote_addr_fallback(self, api_client, teacher_user):
        """Uses REMOTE_ADDR when no X-Forwarded-For"""
        # Simulates: return request.META.get('REMOTE_ADDR')
        
    def test_get_audit_logs_filters_by_user_id(self, api_client, admin_user, teacher_log, admin_log):
        """?user_id=X filters logs"""
        # Simulates: if user_id: logs = logs.filter(user_id=user_id)
        
    def test_get_audit_logs_filters_by_action(self, api_client, admin_user):
        """?action=X filters logs"""
        # Simulates: if action: logs = logs.filter(action=action)
        
    def test_get_audit_logs_filters_by_date_range(self, api_client, admin_user):
        """?start_date=X&end_date=Y filters logs"""
        # Simulates: if start_date: logs = logs.filter(timestamp__gte=start_date)
        
    def test_get_audit_logs_pagination(self, api_client, admin_user, fifty_logs):
        """?page=2&page_size=20 returns correct slice"""
        # Simulates: logs[start:end]
        
    def test_get_audit_logs_blocked_for_teacher(self, api_client, teacher_user):
        """403 when teacher tries to access audit logs"""
        # Simulates: @require_role('admin', 'form_master')
        
    def test_export_audit_logs_generates_csv(self, api_client, admin_user, audit_logs):
        """200 with CSV content-type and data"""
        # Simulates: writer.writerow([...])
        
    def test_export_audit_logs_blocked_for_non_admin(self, api_client, form_master_user):
        """403 when non-admin tries to export"""
        # Simulates: @require_role('admin')
```

**Expected Coverage Increase:** +11%

---

### 8. users/views/users.py (HIGH)

**Uncovered Branches:**
- Non-admin accessing user list
- User updating another user's profile (non-staff)
- Staff updating any profile
- Change password with incorrect current password
- Change password validation errors

**Test Strategy:**
```python
# tests/test_users_views_coverage.py

@pytest.mark.users
class TestUserDetailView:
    """Test profile update authorization"""
    
    def test_user_can_update_own_profile(self, api_client, teacher_user):
        """200 when user updates their own profile"""
        # Simulates: if user.id == request.user.id
        
    def test_user_cannot_update_other_profile(self, api_client, teacher_user, other_teacher):
        """403 when user tries to update another's profile"""
        # Simulates: if user.id != request.user.id and not request.user.is_staff
        
    def test_staff_can_update_any_profile(self, api_client, admin_user, teacher_user):
        """200 when staff updates any profile"""
        # Simulates: request.user.is_staff bypass

@pytest.mark.users
class TestChangePasswordView:
    """Test password change validation"""
    
    def test_change_password_with_incorrect_current(self, api_client, teacher_user):
        """400 when current password is wrong"""
        # Simulates: if not user.check_password(...): return 400
        
    def test_change_password_with_invalid_new_password(self, api_client, teacher_user):
        """400 when new password fails validation"""
        # Simulates: if not serializer.is_valid(): return 400
        
    def test_change_password_success(self, api_client, teacher_user):
        """200 when password changed successfully"""
        # Simulates: user.set_password(...); user.save()
```

**Expected Coverage Increase:** +8%

---

### 9. users/views/auth.py (MEDIUM)

**Uncovered Branches:**
- Cookie setting on successful login
- Cookie setting on token refresh
- Refresh token from cookie extraction
- Mutable data handling in refresh view

**Test Strategy:**
```python
# tests/test_auth_views_coverage.py

@pytest.mark.auth
class TestMyTokenObtainPairView:
    """Test cookie handling on login"""
    
    def test_login_sets_access_cookie(self, api_client, teacher_user):
        """Sets httpOnly access_token cookie on 200"""
        # Simulates: response.set_cookie(key='access_token', ...)
        
    def test_login_sets_refresh_cookie(self, api_client, teacher_user):
        """Sets httpOnly refresh_token cookie on 200"""
        # Simulates: response.set_cookie(key='refresh_token', ...)
        
    def test_login_failure_no_cookies(self, api_client):
        """401 and no cookies set on invalid credentials"""

@pytest.mark.auth
class TestMyTokenRefreshView:
    """Test token refresh from cookie"""
    
    def test_refresh_extracts_token_from_cookie(self, api_client, refresh_token):
        """Reads refresh_token from cookie"""
        # Simulates: refresh_token = request.COOKIES.get('refresh_token')
        
    def test_refresh_sets_new_access_cookie(self, api_client, refresh_token):
        """Sets new access_token cookie on 200"""
        
    def test_refresh_without_cookie_fails(self, api_client):
        """400 when no refresh token in cookie or body"""
```

**Expected Coverage Increase:** +6%

---

## Implementation Priority Order

### Week 1: Security Foundation (P0)
1. `test_core_permissions.py` (2 hours)
2. `test_core_idor_protection.py` (2 hours)
3. `test_attendance_views_coverage.py` (3 hours)

### Week 2: Business Logic (P1)
4. `test_attendance_serializers_coverage.py` (3 hours)
5. `test_students_views_coverage.py` (3 hours)
6. `test_classrooms_views_coverage.py` (2 hours)

### Week 3: Audit & User Management (P1-P2)
7. `test_core_views_coverage.py` (3 hours)
8. `test_users_views_coverage.py` (2 hours)
9. `test_auth_views_coverage.py` (2 hours)

---

## Expected Final Coverage

| Module | Current | Target | Increase |
|--------|---------|--------|----------|
| core/permissions.py | 20% | 95% | +75% |
| core/idor_protection.py | 30% | 100% | +70% |
| attendance/views.py | 45% | 90% | +45% |
| attendance/serializers.py | 50% | 95% | +45% |
| students/views/* | 40% | 85% | +45% |
| core/views.py | 25% | 80% | +55% |
| users/views/* | 60% | 90% | +30% |
| **Overall Backend** | **39%** | **72%** | **+33%** |

---

## Defense Talking Points

### Why These Tests Matter
1. **Security-First Approach**: "We prioritized testing authentication boundaries, RBAC enforcement, and IDOR protection because these are the most critical attack vectors in educational systems handling student data."

2. **Branch Coverage Focus**: "Rather than writing redundant happy-path tests, we targeted uncovered conditional branches—the 'what if' scenarios where security vulnerabilities hide."

3. **Risk-Based Testing**: "We applied industry-standard risk assessment: P0 tests cover authentication/authorization, P1 covers business logic, P2 covers edge cases."

4. **Production-Grade Quality**: "Our test suite validates the same security boundaries that FERPA/GDPR auditors would examine in a production SaaS environment."

### Coverage Metrics Justification
- **70%+ is industry standard** for backend APIs (not 100%)
- **Focused on meaningful coverage**: Security > Business Logic > Config
- **Excluded non-testable code**: Settings files, migrations, __init__.py
- **Branch coverage > line coverage**: Tests decision points, not just execution paths

---

## Anti-Patterns to Avoid

❌ **Don't Test:**
- Django framework internals (e.g., ORM query syntax)
- Third-party library behavior (e.g., JWT token generation)
- Settings.py configuration values
- Database migrations
- Trivial getters/setters

✅ **Do Test:**
- Custom permission logic
- Business rule validation
- Role-based access boundaries
- Error handling paths
- Security enforcement points
