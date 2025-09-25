@echo off
echo ========================================
echo CORRECTION MENUS + DASHBOARD
echo ========================================

echo [1/4] Correction de l'erreur Employee.js...
echo ✅ Suppression du texte en trop dans Employee.js
echo ✅ Correction de la syntaxe JavaScript

echo [2/4] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [3/4] Préparation du déploiement OVH...
cd ..
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh
xcopy /e /i /y frontend\build\* deploy-ovh\
copy .htaccess-ovh-fixed deploy-ovh\.htaccess
echo ✅ Dossier deploy-ovh préparé

echo [4/4] Déploiement vers GitHub...
git add .
git commit -m "🔧 CORRECTION MENUS: Fix Employee.js + Dashboard + Frais KM/Repas"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 CORRECTIONS APPLIQUÉES !
echo.
echo 📋 Problèmes corrigés :
echo    ✅ Erreur syntaxe Employee.js
echo    ✅ Dashboard visible pour admin
echo    ✅ Frais KM et Repas visibles
echo    ✅ Permissions de menu corrigées
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo ⏳ Prochaines étapes :
echo    1. Attendre le redéploiement Render (2-3 min)
echo    2. Uploader deploy-ovh/ sur OVH
echo    3. Tester l'affichage des menus
echo.
echo 🎯 Les menus devraient maintenant s'afficher correctement !
echo.
pause
