@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT SIMPLE ET EFFICACE
echo ========================================

echo 📋 Étape 1: Nettoyage du dossier deploy-ovh...
if exist "deploy-ovh" rmdir /s /q "deploy-ovh"
mkdir deploy-ovh

echo 📋 Étape 2: Build du frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build du frontend
    pause
    exit /b 1
)

echo 📋 Étape 3: Copie des fichiers...
cd ..
xcopy "frontend\build\*" "deploy-ovh\" /E /Y

echo 📋 Étape 4: Copie de l'ancien .htaccess qui fonctionnait...
copy .htaccess-ovh deploy-ovh\.htaccess

echo 📋 Étape 5: Vérification...
echo Contenu du dossier deploy-ovh:
dir deploy-ovh

echo.
echo 🎉 DÉPLOIEMENT PRÊT EN 30 SECONDES !
echo.
echo 📁 Uploadez le contenu de 'deploy-ovh' sur OVH
echo ✅ Utilise l'ancien .htaccess qui fonctionnait
echo ✅ Toutes les corrections incluses
echo ✅ Pas de perte de temps sur la configuration
echo.
echo 🌐 URL: https://www.filmara.fr/plan/

pause


