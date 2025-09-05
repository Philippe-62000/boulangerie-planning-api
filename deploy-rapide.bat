@echo off
echo ========================================
echo   DEPLOIEMENT RAPIDE - MISE A JOUR
echo ========================================
echo.

echo [1/4] Arret du serveur...
taskkill /F /IM node.exe 2>nul
echo ✅ Serveur arrete

echo.
echo [2/4] Build du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)
echo ✅ Frontend construit

echo.
echo [3/4] Copie des fichiers...
cd ..
xcopy "frontend\build\*" "C:\inetpub\wwwroot\plan\" /E /I /Y
xcopy "backend\*" "C:\inetpub\wwwroot\plan\api\" /E /I /Y
echo ✅ Fichiers copies

echo.
echo [4/4] Redemarrage du serveur...
cd "C:\inetpub\wwwroot\plan\api"
start /B node server.js
echo ✅ Serveur redemarre

echo.
echo ========================================
echo   MISE A JOUR TERMINEE !
echo ========================================
echo.
echo 🌐 Application : https://www.filmara.fr/plan
echo.
pause

