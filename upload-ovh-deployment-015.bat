@echo off
echo 📤 Déploiement version 015 - Correction buffer scanner
echo.

echo 🗂️ Suppression de l'ancien build...
if exist "build" rmdir /s /q "build"

echo 📁 Copie du nouveau build...
xcopy "frontend\build\*" "build\" /E /I /Y

echo 🚀 Upload vers OVH...
robocopy "build" "\\ftp.cluster023.hosting.ovh.net\www\plan" /MIR /R:3 /W:10

if %errorlevel% leq 3 (
    echo ✅ Déploiement réussi !
    echo 📊 Version 015 déployée
) else (
    echo ❌ Erreur lors du déploiement
    echo Code d'erreur: %errorlevel%
)

echo.
pause