@echo off
echo ========================================
echo COMPLETE DATABASE RESET
echo ========================================
echo.

echo Step 1: Drop and recreate database...
mysql -u django_user -p -e "DROP DATABASE IF EXISTS school_support_db; CREATE DATABASE school_support_db;"

echo.
echo Step 2: Make fresh migrations...
cd school_support_backend
python manage.py makemigrations

echo.
echo Step 3: Apply migrations...
python manage.py migrate

echo.
echo Step 4: Create superuser (admin)...
echo You will be prompted to create admin user
python manage.py createsuperuser

echo.
echo ========================================
echo RESET COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start server: python manage.py runserver
echo 2. Login as admin
echo 3. Create users, classrooms, students
echo 4. Test dashboard - should show 0 initially
echo.
pause
