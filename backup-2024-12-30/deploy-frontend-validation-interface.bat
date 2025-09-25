@echo off
echo 🚀 Déploiement de l'interface de validation des arrêts maladie
echo.

echo 📦 Construction du frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo.
echo 📁 Copie des fichiers vers OVH...
echo Copie des fichiers React...
xcopy /E /Y /I "build\*" "C:\Users\%USERNAME%\Desktop\boulangerie-planning\plan\"

echo Copie des fichiers CSS spécifiques...
copy /Y "frontend\src\pages\SickLeaveAdmin.css" "C:\Users\%USERNAME%\Desktop\boulangerie-planning\plan\SickLeaveAdmin.css"

echo.
echo ✅ Interface de validation déployée !
echo 📋 Nouvelles fonctionnalités disponibles :
echo    - Interface admin complète pour validation des arrêts maladie
echo    - Configuration email comptable dans Paramètres
echo    - Workflow de validation (pending → validated → declared)
echo    - Téléchargement des fichiers
echo    - Statistiques en temps réel
echo.
echo 🌐 Accès : https://www.filmara.fr/plan/sick-leave-management
echo.
pause
