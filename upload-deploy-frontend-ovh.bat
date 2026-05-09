@echo off
echo ========================================
echo   UPLOAD deploy-ovh VERS OVH (/plan/)
echo ========================================
echo.

echo 📁 Vérification du dossier deploy-ovh...
if not exist "deploy-ovh" (
    echo ❌ Erreur: Le dossier deploy-ovh n'existe pas
    echo    Exécutez d'abord deploy-frontend-ovh.bat (remplit deploy-ovh)
    pause
    exit /b 1
)

echo.
echo 🚀 Upload vers OVH...
echo    Source: deploy-ovh\
echo    Destination: \\ftp.cluster029.hosting.ovh.net\www\plan
echo.

robocopy "deploy-ovh" "\\ftp.cluster029.hosting.ovh.net\www\plan" /MIR /R:3 /W:10 /NP /NDL /NFL

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

