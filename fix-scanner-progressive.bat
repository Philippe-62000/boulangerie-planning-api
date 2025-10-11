@echo off
echo 🔧 Correction du scanner - Gestion des codes progressifs
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
call upload-ovh-deployment-016.bat

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 Changements appliqués :
echo - Gestion des codes progressifs (0→03→039→0396...)
echo - Attente du code complet de 24 caractères
echo - Suppression de l'accumulation dans le buffer
echo.
pause

