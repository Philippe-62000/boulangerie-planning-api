@echo off
echo 🔧 Correction du scanner - Ajout de logs de debug
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
call upload-ovh-deployment-014.bat

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 Changements appliqués :
echo - Logs de debug ajoutés
echo - Bouton test manuel
echo - Focus automatique sur input
echo.
pause
