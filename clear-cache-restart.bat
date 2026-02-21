@echo off
echo ========================================
echo  Clearing Cache and Restarting Frontend
echo ========================================

echo.
echo 1. Stopping any running frontend processes...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Navigating to frontend directory...
cd /d "c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\school_support_frontend"

echo.
echo 3. Clearing npm cache...
npm cache clean --force

echo.
echo 4. Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 5. Reinstalling dependencies...
npm install

echo.
echo 6. Starting development server...
echo.
echo ========================================
echo  Frontend will start in a new window
echo  Please clear your browser cache:
echo  - Press Ctrl+Shift+R (hard refresh)
echo  - Or open DevTools (F12) and right-click refresh button
echo ========================================
echo.

start cmd /k "npm run dev"

echo.
echo Done! The frontend should now show only active users by default.
echo You can toggle "Show disabled users" to see all users.
pause