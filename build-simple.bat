@echo off
echo Building frontend with latest fixes...

echo Step 1: Building frontend...
cd /d C:\boulangerie-planning\frontend
npm run build
echo Build completed!

echo Step 2: Creating frontend-build directory in project...
cd /d C:\boulangerie-planning
if not exist "frontend-build" mkdir frontend-build
if exist "frontend-build" rmdir /s /q frontend-build
mkdir frontend-build

echo Step 3: Copying build files to frontend-build...
xcopy /E /Y frontend\build\* frontend-build\

echo.
echo ========================================
echo BUILD COMPLETED!
echo ========================================
echo.
echo New build created in: C:\boulangerie-planning\frontend-build\
echo.
echo This build includes all the fixes:
echo - useCallback fixes for all pages
echo - Permission icons for vacation management
echo.
echo You can now manually upload these files to your web server.
echo.
pause


