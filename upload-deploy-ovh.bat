@echo off
echo ========================================
echo   UPLOAD DEPLOY-OVH (Arras) VERS OVH
echo ========================================
echo.

echo 📁 Vérification du dossier deploy-ovh...
if not exist "deploy-ovh" (
    echo ❌ Erreur: Le dossier deploy-ovh n'existe pas
    echo    Veuillez d'abord exécuter: cd frontend ^&^& npm run build:plan
    pause
    exit /b 1
)

echo.
echo 🚀 Upload vers OVH (Arras)...
echo    Source: deploy-ovh\
echo    Destination: \\ftp.cluster029.hosting.ovh.net\www\plan
echo.

robocopy "deploy-ovh" "\\ftp.cluster029.hosting.ovh.net\www\plan" /MIR /R:3 /W:10 /NP /NDL /NFL

if %errorlevel% leq 3 (
    echo.
    echo ✅ Déploiement Arras réussi !
    echo 🌐 Vérifiez le site sur: https://www.filmara.fr/plan
) else (
    echo.
    echo ❌ Erreur lors du déploiement
    echo 💡 Vérifiez que le partage réseau OVH est accessible
)

echo.
pause
