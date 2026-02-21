# 🚀 QUICK START: Test Governance Features in 5 Minutes

## Prerequisites Check ✅

```bash
# 1. Backend running?
cd school_support_backend
python manage.py runserver
# Should see: Starting development server at http://127.0.0.1:8000/

# 2. Frontend running?
cd school_support_frontend
npm run dev
# Should see: Local: http://localhost:5173/

# 3. Admin user exists?
# If not, create one:
python manage.py createsuperuser
```

---

## 5-Minute Test Flow

### Step 1: Login (30 seconds)
```
1. Open browser: http://localhost:5173/
2. Enter admin credentials
3. Click "Login"
4. Should redirect to Admin Dashboard
```

### Step 2: Access Governance (10 seconds)
```
1. Look at sidebar (left side)
2. Click "Governance" (⚙️ icon)
3. Should see 4 tabs:
   - User Management
   - Classrooms
   - Enrollments
   - Teacher Assignments
```

### Step 3: Create User (1 minute)
```
1. Click "User Management" tab
2. Click "Create User" button
3. Fill in:
   Name: Test Teacher
   Email: test.teacher@school.edu
   Password: password123
   Role: Teacher
4. Click "Create"
5. ✅ Should see success message
6. ✅ Should see user in table
```

### Step 4: Create Classroom (1 minute)
```
1. Click "Classrooms" tab
2. Click "Create Classroom" button
3. Fill in:
   Classroom Name: Grade 10A
   Academic Year: 2026
   Form Master: (select one or leave unassigned)
4. Click "Create"
5. ✅ Should see success message
6. ✅ Should see classroom in table
```

### Step 5: Enroll Student (1 minute)
```
1. Click "Enrollments" tab
2. Click "Enroll Student" button
3. Fill in:
   Student: (select a student)
   Classroom: Grade 10A
   Academic Year: 2026
4. Click "Enroll"
5. ✅ Should see success message
6. ✅ Should see enrollment in table
```

### Step 6: Assign Teacher (1 minute)
```
1. Click "Teacher Assignments" tab
2. Click "Assign Teacher" button
3. Fill in:
   Teacher: Test Teacher
   Classroom: Grade 10A
   Subject: (select a subject)
4. Click "Assign"
5. ✅ Should see success message
6. ✅ Should see assignment in table
```

### Step 7: Verify Audit Logs (30 seconds)
```
1. Click "Audit Logs" in sidebar (🛡️)
2. ✅ Should see all your actions logged:
   - user_created
   - classroom_created
   - student_enrolled
   - teacher_assigned
```

---

## Quick Troubleshooting

### Issue: "Cannot access Governance tab"
**Solution**: Make sure you're logged in as Admin
```sql
-- Check your role in database
SELECT email, role FROM users WHERE email='your@email.com';
-- Should show: role = 'admin'
```

### Issue: "API returns 403 Forbidden"
**Solution**: Only admins can access governance endpoints
```
1. Logout
2. Login with admin account
3. Try again
```

### Issue: "Form master already assigned error"
**Solution**: This is correct behavior (1:1 mapping)
```
Each form master can only manage ONE classroom
- Form Master A → Grade 10A ✅
- Form Master A → Grade 10B ❌ (already assigned)
```

### Issue: "Student already enrolled error"
**Solution**: This is correct behavior (prevents duplicates)
```
Each student can only be enrolled once per academic year
- Student A → Grade 10A (2026) ✅
- Student A → Grade 10A (2026) ❌ (duplicate)
```

### Issue: "Cannot find students/subjects"
**Solution**: Create test data first
```bash
# Create test students
python manage.py shell
>>> from students.models import Student
>>> Student.objects.create(
...     admission_number='ADM001',
...     full_name='Test Student',
...     gender='male',
...     status='active'
... )

# Create test subjects
>>> from academics.models import Subject
>>> Subject.objects.create(name='Mathematics')
>>> Subject.objects.create(name='English')
```

---

## API Testing (Optional)

### Test with cURL

```bash
# 1. Login to get JWT token
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"your_password"}'

# 2. List users (replace TOKEN with actual token)
curl -X GET http://127.0.0.1:8000/dashboard/admin/users/ \
  -H "Authorization: Bearer TOKEN"

# 3. Create user
curl -X POST http://127.0.0.1:8000/dashboard/admin/users/create/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Teacher",
    "email": "api.test@school.edu",
    "password": "password123",
    "role": "teacher"
  }'
```

### Test with Postman

```
1. Import collection:
   - Method: POST
   - URL: http://127.0.0.1:8000/dashboard/admin/users/create/
   - Headers: Authorization: Bearer {token}
   - Body: JSON
     {
       "name": "Postman Teacher",
       "email": "postman@school.edu",
       "password": "password123",
       "role": "teacher"
     }

2. Send request
3. Should get 201 Created response
```

---

## Feature Checklist

### User Management ✅
- [x] Create user (Admin, Form Master, Teacher)
- [x] Edit user details
- [x] Disable user
- [x] Enable user
- [x] Filter by role
- [x] View assigned classrooms

### Classroom Management ✅
- [x] Create classroom
- [x] Assign form master
- [x] Prevent duplicate form master assignments
- [x] Edit classroom details
- [x] View student counts

### Student Enrollment ✅
- [x] Enroll student in classroom
- [x] Prevent duplicate enrollments
- [x] View all enrollments
- [x] Academic year tracking

### Teacher Assignment ✅
- [x] Assign teacher to class/subject
- [x] Prevent duplicate assignments
- [x] View all assignments
- [x] Many-to-many relationships

### Security ✅
- [x] Admin-only access
- [x] JWT authentication
- [x] RBAC enforcement
- [x] Audit logging
- [x] IDOR protection

---

## Demo Script (For Presentation)

### Opening (30 seconds)
```
"Let me show you our enterprise governance layer. 
I'm logged in as an administrator, and I'll demonstrate 
how we manage users, classrooms, and assignments."
```

### User Creation (1 minute)
```
"First, I'll create a new teacher. Notice that only 
administrators can do this—there's no public registration. 
This ensures only verified school personnel can access 
student data, which is required for FERPA compliance."

[Create user]

"You can see the user appears immediately, and if we 
check the audit logs, we'll see this action was recorded 
with my admin ID, timestamp, and IP address."
```

### Classroom Management (1 minute)
```
"Next, I'll create a classroom and assign a Form Master. 
Notice that each Form Master can only manage one classroom—
this is a business rule we enforce at the database level."

[Create classroom]

"If I try to assign the same Form Master to another 
classroom, the system will prevent it. This ensures 
clear responsibility and prevents data access issues."
```

### Enrollment & Assignment (1 minute)
```
"Now I'll enroll a student in this classroom and assign 
a teacher to teach a subject. The system prevents duplicate 
enrollments and tracks everything by academic year."

[Enroll student, assign teacher]

"All of these actions are logged for compliance and 
accountability. This is critical for educational systems 
handling sensitive student data."
```

### Security Demo (1 minute)
```
"Let me show you the security features. If I logout and 
try to login as a Form Master, I won't see the Governance 
tab—only admins have access. This is role-based access 
control enforced at both frontend and backend levels."

[Show RBAC]

"Additionally, Form Masters can only access their assigned 
classroom. If they try to access another classroom's data, 
the backend will return a 403 Forbidden error. This is 
IDOR protection—preventing Insecure Direct Object Reference 
attacks."
```

### Closing (30 seconds)
```
"This governance layer demonstrates enterprise-level 
system design with centralized user provisioning, 
role-based access control, audit logging, and compliance 
awareness. It goes beyond basic CRUD operations to show 
understanding of real-world security and regulatory 
requirements."
```

---

## Success Criteria

### You've successfully tested the governance layer if:

✅ **User Management**
- Can create users with different roles
- Can edit user details
- Can disable/enable users
- Can filter by role
- Audit logs show all actions

✅ **Classroom Management**
- Can create classrooms
- Can assign form masters
- System prevents duplicate form master assignments
- Can view student counts

✅ **Student Enrollment**
- Can enroll students
- System prevents duplicate enrollments
- Can view all enrollments

✅ **Teacher Assignment**
- Can assign teachers to classes/subjects
- System prevents duplicate assignments
- Can view all assignments

✅ **Security**
- Only admins can access governance
- JWT authentication required
- RBAC enforced
- Audit logs working
- IDOR protection active

---

## Next Steps

### After Testing:
1. ✅ Review audit logs
2. ✅ Test error cases (duplicates, invalid data)
3. ✅ Test with different roles (Form Master, Teacher)
4. ✅ Verify database records
5. ✅ Prepare demo for presentation

### For Presentation:
1. ✅ Practice demo flow (5 minutes)
2. ✅ Prepare talking points
3. ✅ Review architecture diagrams
4. ✅ Anticipate questions
5. ✅ Test on clean database

---

## Quick Reference

**Access**: http://localhost:5173/admin → Governance (⚙️)

**Tabs**:
- User Management (create/manage users)
- Classrooms (create/manage classrooms)
- Enrollments (enroll students)
- Teacher Assignments (assign teachers)

**Security**: Admin role required

**Audit Logs**: Sidebar → Audit Logs (🛡️)

---

**Status**: ✅ READY TO TEST

**Time Required**: 5 minutes

**Difficulty**: Easy

**Prerequisites**: Backend + Frontend running, Admin account
