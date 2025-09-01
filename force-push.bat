@echo off
echo ========================================
echo Force push de nos corrections locales
echo ========================================

echo.
echo 1. Force push sur master...
git push origin master --force

echo.
echo 2. Force push sur main...
git push origin main --force

echo.
echo ========================================
echo Force push termine !
echo ========================================
pause
