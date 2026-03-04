@echo off
echo ========================================
echo Docker Health Check
echo ========================================
echo.

echo [1/5] Checking Containers...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "school_support"
echo.

echo [2/5] Testing Backend Health...
curl -s http://localhost:8000/health/
echo.
echo.

echo [3/5] Testing Database...
docker exec school_support_db mysql -udjango_user -pSchoolSupport123 -e "SELECT 'OK' as Database_Status;" 2>nul
echo.

echo [4/5] Testing Redis...
docker exec school_support_redis redis-cli ping
echo.

echo [5/5] Checking for Errors in Logs...
docker logs school_support_backend --tail 10 2>&1 | findstr /i "error exception failed"
if %errorlevel% equ 0 (
    echo WARNING: Errors found in backend logs!
) else (
    echo No errors found in backend logs
)
echo.

echo ========================================
echo Health Check Complete!
echo ========================================
