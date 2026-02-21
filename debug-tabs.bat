@echo off
echo ========================================
echo  Debug: Checking Governance Tabs Issue
echo ========================================

echo.
echo 1. Checking if all component files exist...

set "frontend_path=c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_frontend\src\admin\components"

echo Checking UserManagement.jsx...
if exist "%frontend_path%\UserManagement.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo Checking ClassroomManagement.jsx...
if exist "%frontend_path%\ClassroomManagement.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo Checking StudentManagement.jsx...
if exist "%frontend_path%\StudentManagement.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo Checking SubjectManagement.jsx...
if exist "%frontend_path%\SubjectManagement.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo Checking EnrollmentManagement.jsx...
if exist "%frontend_path%\EnrollmentManagement.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo Checking TeacherAssignment.jsx...
if exist "%frontend_path%\TeacherAssignment.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo Checking GovernanceView.jsx...
if exist "%frontend_path%\GovernanceView.jsx" (echo ✓ Found) else (echo ✗ Missing)

echo.
echo 2. Starting frontend with debug mode...
cd /d "c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_frontend"

echo.
echo ========================================
echo  INSTRUCTIONS:
echo ========================================
echo 1. Open browser to http://localhost:5173/
echo 2. Login as admin
echo 3. Click ⚙️ Governance in sidebar
echo 4. Press F12 to open DevTools
echo 5. Check Console tab for any errors
echo 6. You should see 6 tabs:
echo    - User Management
echo    - Classroom Management  
echo    - Student Management
echo    - Subject Management
echo    - Student Enrollment
echo    - Teacher Assignment
echo ========================================

npm run dev

pause