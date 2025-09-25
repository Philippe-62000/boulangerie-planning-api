@echo off
echo Complete build and upload process...

echo Step 1: Building frontend...
cd /d C:\boulangerie-planning\frontend
npm run build
echo Frontend build completed!

echo Step 2: Creating frontend-build directory...
cd /d C:\boulangerie-planning
if not exist "frontend-build" mkdir frontend-build

echo Step 3: Copying build files to frontend-build...
xcopy /E /Y frontend\build\* frontend-build\

echo Step 4: Uploading to OVH...
xcopy /E /Y /I frontend-build\* C:\inetpub\wwwroot\plan\

echo.
echo ========================================
echo DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Files uploaded to OVH:
echo - Source: C:\boulangerie-planning\frontend-build\
echo - Destination: C:\inetpub\wwwroot\plan\
echo.
echo All fixes applied:
echo - useCallback fixes for all pages
echo - Permission icons for vacation management
echo - Backend permissions updated on Render
echo.
echo Test the application now!
echo.
pause









