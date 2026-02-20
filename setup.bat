@echo off
echo ========================================
echo School Support System - Setup Script
echo Production Improvements Installation
echo ========================================
echo.

echo [1/6] Installing Backend Dependencies...
cd somali-early-warning-system\school_support_backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/6] Setting up Environment Variables...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env file - PLEASE UPDATE WITH YOUR CREDENTIALS
    echo.
    echo IMPORTANT: Edit .env file with:
    echo   - SECRET_KEY (generate new one)
    echo   - DB_PASSWORD
    echo   - EMAIL credentials
    echo.
    pause
) else (
    echo ✓ .env file already exists
)
echo.

echo [3/6] Creating Logs Directory...
if not exist logs mkdir logs
echo ✓ Logs directory created
echo.

echo [4/6] Running Database Migrations...
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)
echo ✓ Migrations completed
echo.

echo [5/6] Installing Frontend Dependencies...
cd ..\school_support_frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [6/6] Setup Complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Update .env file with your credentials
echo 2. Generate SECRET_KEY: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
echo 3. Start backend: python manage.py runserver
echo 4. Start frontend: npm run dev
echo.
echo Optional: Install Redis for caching
echo   - Download: https://github.com/microsoftarchive/redis/releases
echo   - Update REDIS_URL in .env
echo.
echo For Docker deployment: docker-compose up --build
echo.
echo See PRODUCTION_IMPROVEMENTS.md for full documentation
echo ========================================
pause
