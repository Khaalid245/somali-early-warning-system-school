# 🏛️ CENTRALIZED USER & CLASSROOM MANAGEMENT - ARCHITECTURAL DESIGN

## System Governance Philosophy

### Why Centralized Control?

In enterprise educational systems handling sensitive student data (FERPA-protected), **centralized user provisioning is not optional—it's mandatory**. Here's why:

#### 1. **Data Sovereignty & Accountability**
- Every user must be **provisioned by a trusted authority** (Admin)
- No self-registration prevents unauthorized access to student PII
- Clear chain of custody: Admin creates → User operates → Audit logs track

#### 2. **Compliance Requirements (FERPA/GDPR)**
- **FERPA §99.31**: Schools must maintain control over who accesses student records
- **GDPR Article 32**: Requires "appropriate technical measures" including access control
- Public registration = compliance violation (anyone could claim to be a teacher)

#### 3. **Operational Integrity**
- Form Masters must be **explicitly assigned** to classrooms (not self-selected)
- Teachers must be **authorized** to access specific classes
- Students must be **enrolled** by admin (prevents fake enrollments)

#### 4. **Security Posture**
- Prevents privilege escalation (user can't self-promote to admin)
- Prevents IDOR attacks (users can't access unauthorized classrooms)
- Enables immediate revocation (admin disables user, access stops instantly)

---

## Centralized User Lifecycle Management

### Why Admin Must Control User Creation

**Enterprise Principle:** *"Trust is provisioned, not assumed."*

#### User Creation Flow:
```
Admin → Creates User → Assigns Role → User Receives Credentials → User Logs In
```

**Why This Matters:**

1. **Role Assignment at Creation**
   - Role determines permissions (admin/form_master/teacher)
   - Cannot be changed by user (prevents privilege escalation)
   - Validated server-side on every request

2. **Classroom Assignment**
   - Form Master assigned to ONE classroom (1:1 relationship)
   - Teacher assigned to MULTIPLE classes (M:N relationship)
   - Admin controls these assignments (not user-selected)

3. **Soft Deletion (Disable, Not Delete)**
   - Users are marked `is_active=False` instead of deleted
   - Preserves audit trail (who created alerts, cases, etc.)
   - Can be re-enabled if needed (e.g., returning teacher)
   - Complies with data retention policies

#### What Admin Must Manage:

| Entity | Admin Action | Why Required |
|--------|--------------|--------------|
| **Users** | Create, Edit, Disable | Control who accesses system |
| **Roles** | Assign (admin/form_master/teacher) | Define permission boundaries |
| **Classrooms** | Create, Assign Form Master | Establish organizational structure |
| **Enrollments** | Enroll students in classrooms | Control data access scope |
| **Assignments** | Assign teachers to classes | Define teaching responsibilities |

---

## Role Isolation and Access Boundaries

### RBAC (Role-Based Access Control) Enforcement

**Backend Validation (Django):**

```python
# Every API endpoint validates role
@permission_classes([IsAuthenticated])
def get_students(request):
    user = request.user
    
    if user.role == 'admin':
        return Student.objects.all()  # See all students
    
    elif user.role == 'form_master':
        # Only see students in assigned classroom
        classroom = Classroom.objects.get(form_master=user)
        return Student.objects.filter(enrollments__classroom=classroom)
    
    elif user.role == 'teacher':
        # Only see students in assigned classes
        classes = TeachingAssignment.objects.filter(teacher=user)
        return Student.objects.filter(enrollments__classroom__in=classes)
    
    return Student.objects.none()  # Default: no access
```

### Access Boundaries by Role:

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| **Admin** | All students, all classrooms, all users | N/A (full access) |
| **Form Master** | Own classroom students, own cases | Other classrooms, user management |
| **Teacher** | Assigned class students, own alerts | Other classes, cases, user management |

### Preventing IDOR (Insecure Direct Object Reference):

**Bad (Vulnerable):**
```python
# User can access any student by changing ID in URL
student = Student.objects.get(id=request.GET['id'])
```

**Good (Secure):**
```python
# User can only access students they're authorized to see
student = Student.objects.get(
    id=request.GET['id'],
    enrollments__classroom__form_master=request.user  # Scoped to user's classroom
)
```

---

## Security & Compliance Model

### 1. **Authentication Layer**
- JWT tokens with expiration (30 min)
- Refresh tokens for session management
- Token revocation on user disable

### 2. **Authorization Layer**
- Role checked on every API request
- Classroom scope validated server-side
- No client-side permission logic (can be bypassed)

### 3. **Audit Logging**
- All admin actions logged (user creation, role changes, assignments)
- Immutable audit trail (cannot be deleted)
- Includes: who, what, when, metadata

### 4. **Data Isolation**
- Form Masters see only their classroom
- Teachers see only their assigned classes
- Students cannot be accessed across classroom boundaries

### 5. **Soft Deletion**
- Users marked inactive, not deleted
- Preserves referential integrity (alerts, cases still linked)
- Complies with "right to be forgotten" (can anonymize later)

---

## Architectural Trade-offs (Capstone vs Enterprise)

### Current State: Django Admin for User Management

**Pros:**
- ✅ Already built and tested
- ✅ Full CRUD functionality
- ✅ Role assignment works
- ✅ Classroom management exists
- ✅ Zero development time

**Cons:**
- ❌ Separate interface (not integrated)
- ❌ Technical UI (not user-friendly)
- ❌ No audit logging for admin actions
- ❌ No soft delete UI (must use database)
- ❌ Not branded (looks like Django, not your app)

### Proposed: Minimal Governance Layer in Admin Dashboard

**What to Build:**
- User management (create, edit, disable)
- Classroom management (create, assign form master)
- Student enrollment (assign students to classrooms)
- Teacher assignment (assign teachers to classes)
- Audit logging for all actions

**Why This Completes the System:**

1. **Single Interface** - Admin doesn't leave dashboard
2. **Branded Experience** - Matches your app design
3. **Audit Logging** - All actions tracked in AuditLog
4. **User-Friendly** - Simple forms, not technical
5. **Enterprise-Ready** - Meets SaaS standards

**Scope Control:**
- ❌ No password reset UI (use Django admin)
- ❌ No bulk import (use Django admin)
- ❌ No advanced permissions (RBAC is enough)
- ✅ Focus on core governance: create, assign, disable

---

## Final Enterprise Recommendation

### Minimal Governance Layer (2-3 hours to build)

**What to Implement:**

1. **User Management Tab**
   - List all users (table with name, email, role, status)
   - Create user (form: name, email, password, role)
   - Edit user (update name, email, role)
   - Disable user (soft delete, mark inactive)
   - Filter by role (admin/form_master/teacher)

2. **Classroom Management Tab**
   - List all classrooms (table with name, form master, student count)
   - Create classroom (form: name, academic year)
   - Assign form master (dropdown of form masters)
   - View students in classroom (expandable)
   - Disable classroom (soft delete)

3. **Enrollment Management**
   - Enroll student in classroom (student dropdown + classroom dropdown)
   - View enrollments (table with student, classroom, date)
   - Transfer student (change classroom)
   - Unenroll student (mark inactive)

4. **Teacher Assignment**
   - Assign teacher to class (teacher dropdown + class dropdown + subject)
   - View assignments (table with teacher, class, subject)
   - Remove assignment (mark inactive)

**Backend Endpoints (8 new):**
```
POST   /admin/users/                    # Create user
PATCH  /admin/users/<id>/               # Update user
POST   /admin/users/<id>/disable/       # Disable user
GET    /admin/classrooms/               # List classrooms
POST   /admin/classrooms/               # Create classroom
PATCH  /admin/classrooms/<id>/          # Update classroom
POST   /admin/enrollments/              # Enroll student
POST   /admin/assignments/              # Assign teacher
```

**Frontend Components (4 new):**
```
admin/components/UserManagement.jsx
admin/components/ClassroomManagement.jsx
admin/components/EnrollmentManagement.jsx
admin/components/TeacherAssignment.jsx
```

---

## Why This Matters for Your Capstone

### Without User Management:
- ❌ Incomplete governance model
- ❌ Judges ask: "How do users get created?"
- ❌ Answer: "Django admin" (not impressive)
- ❌ System feels incomplete

### With User Management:
- ✅ Complete governance model
- ✅ Judges see: "Admin controls everything"
- ✅ Answer: "Centralized provisioning with audit trail"
- ✅ System feels enterprise-ready

### Effort vs Impact:
- **Time:** 2-3 hours
- **Code:** ~800 lines (backend + frontend)
- **Impact:** Transforms from "good" to "exceptional"
- **Score:** 9/10 → 10/10

---

## Implementation Priority

### Must Have (Core Governance):
1. ✅ User creation (admin, form master, teacher)
2. ✅ Role assignment
3. ✅ User disable (soft delete)
4. ✅ Classroom creation
5. ✅ Form master assignment to classroom

### Should Have (Operational):
6. ✅ Student enrollment in classroom
7. ✅ Teacher assignment to class

### Nice to Have (Enhancement):
8. ⚠️ Bulk user import (CSV)
9. ⚠️ Password reset UI
10. ⚠️ User profile editing

---

## Conclusion

**Centralized user and classroom management is the missing piece** that transforms your admin dashboard from a monitoring tool into a complete governance platform.

**Key Takeaways:**

1. **Security:** Prevents unauthorized access and privilege escalation
2. **Compliance:** Meets FERPA/GDPR requirements
3. **Accountability:** All actions logged in audit trail
4. **Completeness:** Admin controls entire system lifecycle
5. **Enterprise-Ready:** Matches SaaS best practices

**Recommendation:** Build the minimal governance layer (5 core features) to complete your capstone. This demonstrates understanding of enterprise architecture while maintaining reasonable scope.

---

**Next Step:** Implement user and classroom management in admin dashboard.

**Estimated Time:** 2-3 hours  
**Impact:** High (completes governance model)  
**Complexity:** Medium (standard CRUD with RBAC)  
**Value:** Essential for enterprise credibility
