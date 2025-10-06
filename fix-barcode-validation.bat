@echo off
echo 🔧 Correction de la validation des codes-barres - 24 caractères uniquement
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 🔨 Construction du frontend avec les corrections...
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
call upload-ovh-deployment-013.bat

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 Changements appliqués :
echo - Validation uniquement sur 24 caractères
echo - Message d'erreur clair pour rescanner
echo - Mode test mis à jour
echo.
pause
