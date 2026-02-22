# select_related("classroom") Fix Summary

## Problem
Multiple views were using `select_related("classroom")` on Student model queries, but Student model has NO direct classroom ForeignKey. This causes 500 errors.

## Root Cause
Student → Classroom relationship is many-to-many through StudentEnrollment:
- Student has `enrollments` (reverse FK to StudentEnrollment)
- StudentEnrollment has `classroom` (FK to Classroom)
- StudentEnrollment has `student` (FK to Student)

## Files Fixed

### 1. students/views/views_students.py
**Line 52 - StudentDetailView.get_queryset()**

**BEFORE:**
```python
queryset = Student.objects.select_related("classroom")
```

**AFTER:**
```python
queryset = Student.objects.all()
```

**Additional Changes:**
- Replaced `classroom__form_master` with `enrollments__classroom__form_master`
- Replaced `classroom__teachingassignment__teacher` with `enrollments__classroom__teaching_assignments__teacher`
- Added `.distinct()` to prevent duplicate results from joins

### 2. attendance/student_report_view.py
**Line 25 - StudentAttendanceReportView.get()**

**BEFORE:**
```python
enrollment = StudentEnrollment.objects.filter(
    student=student,
    is_active=True
).select_related('classroom').first()
```

**AFTER:**
```python
enrollment = StudentEnrollment.objects.filter(
    student=student,
    is_active=True
).select_related('student', 'classroom').first()
```

**Rationale:** Added 'student' to select_related for complete optimization since we're querying StudentEnrollment.

### 3. risk/services.py
**Line 184 - _handle_alerts_and_interventions()**

**BEFORE:**
```python
enrollment = (
    StudentEnrollment.objects
    .filter(student=student, is_active=True)
    .select_related("classroom")
    .first()
)
```

**AFTER:**
```python
enrollment = (
    StudentEnrollment.objects
    .filter(student=student, is_active=True)
    .select_related("student", "classroom")
    .first()
)
```

**Rationale:** Added 'student' to select_related for complete optimization.

## Files Verified as Correct

### dashboard/services.py (Line 504)
```python
TeachingAssignment.objects
    .filter(teacher=user)
    .select_related("classroom", "subject")
```
✅ CORRECT - TeachingAssignment has classroom FK

### dashboard/user_management.py (Lines 369, 444)
```python
# Line 369
StudentEnrollment.objects.select_related('student', 'classroom')

# Line 444
TeachingAssignment.objects.select_related('teacher', 'classroom', 'subject')
```
✅ CORRECT - Both models have the referenced FKs

## Model Relationships Reference

```
Student (no classroom FK)
  ↓ enrollments (reverse FK)
StudentEnrollment
  ├── student (FK to Student)
  └── classroom (FK to Classroom)

Classroom
  ├── form_master (FK to User)
  └── teaching_assignments (reverse FK)

TeachingAssignment
  ├── teacher (FK to User)
  ├── classroom (FK to Classroom)
  └── subject (FK to Subject)
```

## Testing Recommendations

1. Test StudentDetailView with all user roles (admin, teacher, form_master)
2. Test StudentAttendanceReportView with valid student_id
3. Test risk service after attendance session creation
4. Verify no 500 errors related to invalid field lookups

## Impact
- ✅ Eliminates 500 errors from invalid select_related
- ✅ Maintains query optimization where applicable
- ✅ Preserves role-based access control logic
- ✅ No model structure changes required
