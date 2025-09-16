@echo off
echo Building frontend...
cd /d C:\boulangerie-planning\frontend
npm run build
echo Build completed!

echo Copying files to build directory...
xcopy /E /Y build\* ..\frontend-build\

echo Deployment completed!
pause






