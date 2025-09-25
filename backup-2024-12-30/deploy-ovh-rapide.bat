@echo off
echo ========================================
echo DEPLOIEMENT RAPIDE OVH - MISE A JOUR
echo ========================================
echo.

echo [1/4] Construction du frontend...
cd frontend
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)
echo ✅ Frontend construit

echo.
echo [2/4] Copie des fichiers...
cd ..
xcopy "frontend\build\*" "deploy-ovh-nouvelle-version\" /E /Y /Q
xcopy "backend\*" "deploy-ovh-nouvelle-version\api\" /E /Y /Q
echo ✅ Fichiers copies

echo.
echo [3/4] Nettoyage...
rmdir /s /q "deploy-ovh-nouvelle-version\api\node_modules" 2>nul
rmdir /s /q "deploy-ovh-nouvelle-version\api\src" 2>nul
rmdir /s /q "deploy-ovh-nouvelle-version\api\test" 2>nul
echo ✅ Nettoyage termine

echo.
echo [4/4] Verification...
if exist "deploy-ovh-nouvelle-version\.htaccess" (
    echo ✅ Fichier .htaccess present
) else (
    echo ⚠️  Creation du fichier .htaccess...
    echo RewriteEngine On > deploy-ovh-nouvelle-version\.htaccess
    echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-nouvelle-version\.htaccess
    echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-nouvelle-version\.htaccess
    echo RewriteRule . /index.html [L] >> deploy-ovh-nouvelle-version\.htaccess
)

echo.
echo ========================================
echo   MISE A JOUR OVH TERMINEE !
echo ========================================
echo.
echo 📂 Dossier pret : deploy-ovh-nouvelle-version\
echo 🌐 URL : https://www.filmara.fr/plan
echo.
echo 💡 ACTIONS REQUISES :
echo    1. Upload des fichiers sur OVH
echo    2. Redemarrage du serveur Node.js
echo.
pause

