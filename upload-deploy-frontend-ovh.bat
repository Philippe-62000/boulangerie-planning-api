@echo off
echo ========================================
echo   UPLOAD DEPLOY-FRONTEND VERS OVH
echo ========================================
echo.

echo 📁 Vérification du dossier deploy-frontend...
if not exist "deploy-frontend" (
    echo ❌ Erreur: Le dossier deploy-frontend n'existe pas
    echo    Veuillez d'abord exécuter deploy-frontend-ovh.bat
    pause
    exit /b 1
)

echo.
echo 🚀 Upload vers OVH...
echo    Source: deploy-frontend\
echo    Destination: \\ftp.cluster029.hosting.ovh.net\www\plan
echo.

robocopy "deploy-frontend" "\\ftp.cluster029.hosting.ovh.net\www\plan" /MIR /R:3 /W:10 /NP /NDL /NFL

if %errorlevel% leq 3 (
    echo.
    echo ✅ Déploiement réussi !
    echo 📊 Fichiers uploadés vers OVH
    echo.
    echo 🌐 Vérifiez le site sur: https://www.filmara.fr/plan
) else (
    echo.
    echo ❌ Erreur lors du déploiement
    echo Code d'erreur: %errorlevel%
    echo.
    echo 💡 Vérifiez que:
    echo    - Le partage réseau OVH est accessible
    echo    - Vous êtes connecté au réseau OVH
    echo    - Les permissions d'accès sont correctes
)

echo.
pause

