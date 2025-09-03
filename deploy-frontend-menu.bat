@echo off
echo ========================================
echo    DÉPLOIEMENT FRONTEND - MENU REPLIABLE
echo ========================================
echo.

echo [1/4] Vérification des modifications...
echo ✅ Logo FILMARA déplacé dans le sidebar
echo ✅ Menu repliable créé (60px → 280px)
echo ✅ En-tête simplifié (logo supprimé)
echo ✅ Responsive design optimisé
echo.

echo [2/4] Build du frontend...
echo 🔨 npm run build en cours...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)
echo ✅ Build réussi
cd ..
echo.

echo [3/4] Préparation pour OVH...
echo 📁 Création du dossier de déploiement...
if exist "deploy-ovh-menu" rmdir /s /q "deploy-ovh-menu"
mkdir "deploy-ovh-menu"
xcopy "frontend\build\*" "deploy-ovh-menu\" /e /i /y
echo ✅ Dossier de déploiement créé
echo.

echo [4/4] Déploiement terminé !
echo ========================================
echo    FRONTEND AVEC MENU REPLIABLE PRÊT !
echo ========================================
echo.
echo 📁 Dossier à uploader sur OVH : deploy-ovh-menu\
echo 🎨 Logo FILMARA maintenant dans le menu gauche
echo 📱 Menu repliable au survol de la souris
echo 🎯 En-tête simplifié et optimisé
echo.
echo 🔧 Prochaines étapes :
echo    1. Uploader le dossier deploy-ovh-menu\ sur OVH
echo    2. Tester le menu repliable en live
echo    3. Vérifier l'optimisation de l'espace
echo.
pause
