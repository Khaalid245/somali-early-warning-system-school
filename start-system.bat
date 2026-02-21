@echo off
echo ========================================
echo  Starting School EWS System
echo ========================================

echo.
echo 1. Starting Backend Server...
cd /d "c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_backend"

echo Activating virtual environment...
call .venv\Scripts\activate

echo Starting Django server...
start cmd /k "python manage.py runserver"

echo.
echo 2. Starting Frontend Server...
cd /d "c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_frontend"

echo Starting React development server...
start cmd /k "npm run dev"

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000/
echo Frontend: http://localhost:5173/
echo.
echo To access governance features:
echo 1. Login as admin
echo 2. Click ⚙️ Governance in sidebar
echo 3. Use all 6 tabs: Users, Classrooms, Students, Subjects, Enrollments, Teachers
echo.
pause