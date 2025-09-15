@echo off
echo Deploying SickLeaveAdmin fix...

echo Building frontend...
cd /d C:\boulangerie-planning\frontend
npm run build
echo Frontend build completed!

echo Copying files to build directory...
xcopy /E /Y build\* ..\frontend-build\

echo Frontend deployment completed!
echo.
echo Fix applied:
echo - Added useCallback to fetchSickLeaves and fetchStats in SickLeaveAdmin.js
echo - This should resolve the "Cannot access 'C' before initialization" error
echo.
pause


