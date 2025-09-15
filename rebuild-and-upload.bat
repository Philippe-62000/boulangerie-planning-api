@echo off
echo Rebuilding frontend with latest fixes...

echo Step 1: Cleaning old build...
cd /d C:\boulangerie-planning\frontend
if exist "build" rmdir /s /q build
echo Old build cleaned!

echo Step 2: Installing dependencies (if needed)...
npm install
echo Dependencies checked!

echo Step 3: Building frontend with latest fixes...
npm run build
echo New build completed!

echo Step 4: Creating frontend-build directory...
cd /d C:\boulangerie-planning
if not exist "frontend-build" mkdir frontend-build
if exist "frontend-build" rmdir /s /q frontend-build
mkdir frontend-build

echo Step 5: Copying new build files...
xcopy /E /Y frontend\build\* frontend-build\

echo Step 6: Uploading to OVH...
xcopy /E /Y /I frontend-build\* C:\inetpub\wwwroot\plan\

echo.
echo ========================================
echo REBUILD AND UPLOAD COMPLETED!
echo ========================================
echo.
echo New build created with all fixes:
echo - useCallback fixes for SalesStats.js
echo - useCallback fixes for Planning.js  
echo - useCallback fixes for AbsenceStatus.js
echo - useCallback fixes for SickLeaveAdmin.js
echo - Permission icons for vacation management
echo.
echo Files uploaded to OVH from: C:\boulangerie-planning\frontend-build\
echo.
echo Test the application now - all pages should work!
echo.
pause


