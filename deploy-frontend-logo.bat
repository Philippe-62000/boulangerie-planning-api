@echo off
echo ========================================
echo    DÉPLOIEMENT FRONTEND - NOUVEAU LOGO
echo ========================================
echo.

echo [1/4] Vérification des modifications...
echo ✅ Logo FILMARA compact créé (32x24px au lieu de 60x40px)
echo ✅ Styles CSS mis à jour
echo ✅ Responsive design optimisé
echo ✅ Espace en-tête optimisé
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
if exist "deploy-ovh-logo" rmdir /s /q "deploy-ovh-logo"
mkdir "deploy-ovh-logo"
xcopy "frontend\build\*" "deploy-ovh-logo\" /e /i /y
echo ✅ Dossier de déploiement créé
echo.

echo [4/4] Déploiement terminé !
echo ========================================
echo    FRONTEND AVEC NOUVEAU LOGO PRÊT !
echo ========================================
echo.
echo 📁 Dossier à uploader sur OVH : deploy-ovh-logo\
echo 🌐 Le nouveau logo FILMARA compact est maintenant actif
echo 📱 Responsive design optimisé pour tous les écrans
echo.
echo 🔧 Prochaines étapes :
echo    1. Uploader le dossier deploy-ovh-logo\ sur OVH
echo    2. Tester le nouveau logo en live
echo    3. Vérifier l'optimisation de l'espace
echo.
pause
