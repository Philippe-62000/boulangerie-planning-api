@echo off
echo ========================================
echo CORRECTION MODAL CLIGNOTEMENT
echo ========================================

echo [1/3] Corrections appliquées...
echo ✅ Modal flottant pour ajouter employé
echo ✅ Suppression conflit structure modal
echo ✅ Gestion clic overlay pour fermer
echo ✅ Correction syntaxe Employee.js
echo ✅ Logs debug absences

echo [2/3] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [3/3] Préparation du déploiement OVH...
cd ..
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh
xcopy /e /i /y frontend\build\* deploy-ovh\
copy .htaccess-ovh-fixed deploy-ovh\.htaccess
echo ✅ Dossier deploy-ovh préparé

echo.
echo 🎉 CORRECTION MODAL APPLIQUÉE !
echo.
echo 📋 Corrections apportées :
echo    ✅ Modal flottant au lieu d'insertion dans le DOM
echo    ✅ Suppression conflit entre deux structures modal
echo    ✅ Gestion clic sur overlay pour fermer
echo    ✅ Correction syntaxe Employee.js
echo    ✅ Logs debug pour absences
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload :
echo    1. Cliquer sur "Ajouter un employé" - ne doit plus clignoter
echo    2. Vérifier que le modal s'ouvre correctement
echo    3. Tester la fermeture par clic sur overlay
echo    4. Vérifier les arrêts maladie dans l'état des absences
echo.
echo 🎯 Le modal ne devrait plus clignoter !
echo.
pause
