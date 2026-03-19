@echo off
echo ========================================
echo GENERATING TEST COVERAGE REPORT
echo ========================================
echo.

echo Step 1: Running tests with coverage...
coverage run --source=. manage.py test --verbosity=1

echo.
echo Step 2: Generating coverage report...
echo.
coverage report --skip-empty

echo.
echo Step 3: Generating HTML report...
coverage html

echo.
echo ========================================
echo COVERAGE REPORT COMPLETE!
echo ========================================
echo.
echo Terminal Report: See above
echo HTML Report: Opening in browser...
echo.

start htmlcov\index.html

pause
