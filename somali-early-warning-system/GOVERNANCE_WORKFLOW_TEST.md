# GOVERNANCE WORKFLOW TEST GUIDE

## Test Order (Follow this sequence):

### 1. CREATE USERS ✓
**Tab:** User Management
**Action:** Click "Create User"
**Test Data:**
- Name: Test Teacher
- Email: teacher@test.com
- Role: Teacher
- Password: test123

**Expected:** User appears in table

---

### 2. CREATE SUBJECTS ✓
**Tab:** Subject Management  
**Action:** Click "Add Subject"
**Test Data:**
- Subject Name: Mathematics

**API Endpoint:** POST /academics/subjects/
**Expected:** Subject appears in grid

---

### 3. CREATE CLASSROOM ✓
**Tab:** Classroom Management
**Action:** Click "Create Classroom"
**Test Data:**
- Classroom Name: Grade 10A
- Academic Year: 2025
- Form Master: (Select from dropdown)

**API Endpoint:** POST /dashboard/admin/classrooms/create/
**Expected:** Classroom appears in table

---

### 4. CREATE STUDENT ✓
**Tab:** Student Management
**Action:** Click "Add Student"
**Test Data:**
- Admission Number: ADM001
- Full Name: John Doe
- Gender: Male

**API Endpoint:** POST /students/
**Expected:** Student appears in table

---

### 5. ENROLL STUDENT ✓
**Tab:** Student Enrollment
**Action:** Click "Enroll Student"
**Test Data:**
- Student: John Doe (ADM001)
- Classroom: Grade 10A (2025)
- Academic Year: 2025

**API Endpoint:** POST /dashboard/admin/enrollments/create/
**Expected:** Enrollment appears in table
**Dashboard Check:** Admin dashboard should now show 1 active student

---

### 6. ASSIGN TEACHER ✓
**Tab:** Teacher Assignment
**Action:** Click "Assign Teacher"
**Test Data:**
- Teacher: Test Teacher
- Classroom: Grade 10A
- Subject: Mathematics

**API Endpoint:** POST /dashboard/admin/assignments/create/
**Expected:** Assignment appears in table

---

## VERIFICATION CHECKLIST

After completing all steps, verify:

1. ✓ Admin Dashboard shows 1 active student
2. ✓ School Risk Index shows 0.0 (no alerts yet)
3. ✓ User Management shows all created users
4. ✓ Classroom Management shows Grade 10A with 1 student
5. ✓ Student Enrollment shows John Doe enrolled in Grade 10A
6. ✓ Teacher Assignment shows Test Teacher assigned to Mathematics

---

## COMMON ISSUES

**Issue:** "Failed to create student"
**Fix:** Check if admission number is unique

**Issue:** "Failed to enroll student"  
**Fix:** Ensure student and classroom exist first

**Issue:** "Failed to assign teacher"
**Fix:** Ensure teacher user, classroom, and subject all exist

**Issue:** Dashboard still shows 0 students
**Fix:** Student must be ENROLLED in a classroom (step 5)

---

## API ENDPOINTS USED

- POST /dashboard/admin/users/create/
- POST /academics/subjects/
- POST /dashboard/admin/classrooms/create/
- POST /students/
- POST /dashboard/admin/enrollments/create/
- POST /dashboard/admin/assignments/create/

All endpoints should return 200/201 status codes on success.
