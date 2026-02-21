@echo off
echo ========================================
echo  Fixing Governance Tabs Issue
echo ========================================

echo.
echo 1. Applied fixes to GovernanceView component
echo 2. Created debug version with error handling
echo 3. Updated AdminDashboard to use fixed version

echo.
echo Starting frontend server...
cd /d "c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_frontend"

echo.
echo ========================================
echo  TEST INSTRUCTIONS:
echo ========================================
echo 1. Go to: http://localhost:5173/
echo 2. Login as admin
echo 3. Click ⚙️ Governance in sidebar
echo 4. You should now see ALL 6 tabs:
echo    ✓ User Management
echo    ✓ Classroom Management
echo    ✓ Student Management
echo    ✓ Subject Management
echo    ✓ Student Enrollment
echo    ✓ Teacher Assignment
echo.
echo 5. Press F12 and check Console for debug info
echo 6. Click each tab to verify they work
echo ========================================

npm run dev

pause