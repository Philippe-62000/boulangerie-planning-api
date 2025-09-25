@echo off
echo Deploying permissions fixes...

echo Building frontend...
cd /d C:\boulangerie-planning\frontend
npm run build
echo Frontend build completed!

echo Copying files to build directory...
xcopy /E /Y build\* ..\frontend-build\

echo Frontend deployment completed!
echo.
echo Backend changes need to be deployed to Render.com
echo Please commit and push the changes to trigger automatic deployment
echo.
echo Changes made:
echo - Fixed useCallback issues in SalesStats.js, Planning.js, AbsenceStatus.js
echo - Added missing icons for sick-leave-management and vacation-management in Parameters.js
echo - Added default permissions for sick-leave-management and vacation-management in MenuPermissions.js
echo.
pause









