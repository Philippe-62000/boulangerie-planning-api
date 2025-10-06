@echo off
echo 🔧 Correction du scanner - Gestion du buffer pour codes complets
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
call upload-ovh-deployment-015.bat

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 Changements appliqués :
echo - Gestion des codes complets de 24 caractères
echo - Buffer pour codes partiels
echo - Test avec code réel: 039624357600068022200005
echo.
pause
