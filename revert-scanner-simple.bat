@echo off
echo 🔄 Retour à la version simple du scanner qui fonctionnait
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 🔨 Construction du frontend avec la version simple...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo ✅ Construction réussie
echo.

echo 📤 Déploiement vers OVH...
cd ..
call upload-ovh-deployment-018.bat

echo.
echo ✅ Version simple déployée !
echo.
echo 🎯 Logique restaurée :
echo - Validation 24 caractères uniquement
echo - Message d'erreur clair pour rescanner
echo - Pas de buffer complexe
echo - Fonctionnement comme avant
echo.
pause

