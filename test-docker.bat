@echo off
echo ========================================
echo Docker Setup Test Script
echo ========================================
echo.

echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✓ Docker is installed
echo.

echo [2/5] Checking docker-compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose is not available
    pause
    exit /b 1
)
echo ✓ docker-compose is available
echo.

echo [3/5] Stopping any existing containers...
cd somali-early-warning-system
docker-compose down
echo ✓ Cleaned up existing containers
echo.

echo [4/5] Building and starting services...
echo This may take 5-10 minutes on first run...
docker-compose up --build -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    echo Check logs with: docker-compose logs
    pause
    exit /b 1
)
echo ✓ Services started
echo.

echo [5/5] Waiting for services to be ready...
timeout /t 30 /nobreak >nul
echo.

echo ========================================
echo Testing Services
echo ========================================
echo.

echo Testing Backend Health...
curl -s http://localhost:8000/health/ >nul 2>&1
if errorlevel 1 (
    echo ⚠ Backend not responding yet (may need more time)
    echo Check with: docker-compose logs backend
) else (
    echo ✓ Backend is healthy
)
echo.

echo Testing Frontend...
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo ⚠ Frontend not responding yet
) else (
    echo ✓ Frontend is serving
)
echo.

echo ========================================
echo Docker Setup Complete!
echo ========================================
echo.
echo Services:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   Health:   http://localhost:8000/health/
echo.
echo Useful Commands:
echo   View logs:    docker-compose logs -f
echo   Stop:         docker-compose down
echo   Restart:      docker-compose restart
echo.
echo See DOCKER_TESTING.md for troubleshooting
echo ========================================
pause
