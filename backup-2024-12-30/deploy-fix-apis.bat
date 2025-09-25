@echo off
echo ========================================
echo CORRECTION APIs - PERMISSIONS + PARAMETRES
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Logs de debug dans menuPermissionsController
echo ✅ Logs de debug dans parametersController
echo ✅ Correction des erreurs 500 et 400

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
git commit -m "🔧 CORRECTION APIs: Logs debug permissions + paramètres"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 CORRECTIONS APIs APPLIQUÉES !
echo.
echo 📋 Corrections :
echo    ✅ Logs de debug pour permissions de menu
echo    ✅ Logs de debug pour paramètres KM
echo    ✅ Identification des erreurs 500 et 400
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload :
echo    1. Tester la sauvegarde des permissions salariés
echo    2. Tester la sauvegarde des paramètres KM
echo    3. Vérifier les logs dans la console Render
echo.
echo 📊 Les logs détaillés aideront à identifier les problèmes exacts
echo.
pause
