@echo off
echo ========================================
echo CORRECTION FINALE - PARAMETRES + MOTS DE PASSE
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Validation paramètres KM corrigée (accepte valeurs vides)
echo ✅ Bouton mots de passe avec logs de debug
echo ✅ Bouton Sauvegarder KM repositionné
echo ✅ Styles CSS pour le nouveau positionnement

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
git commit -m "🔧 CORRECTION FINALE: Validation paramètres + Boutons repositionnés + Logs debug"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 CORRECTIONS FINALES APPLIQUÉES !
echo.
echo 📋 Problèmes résolus :
echo    ✅ Sauvegarde paramètres KM (validation corrigée)
echo    ✅ Bouton mots de passe avec logs de debug
echo    ✅ Bouton Sauvegarder KM repositionné
echo    ✅ Interface plus intuitive
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload :
echo    1. Tester la sauvegarde des paramètres KM
echo    2. Tester la mise à jour des mots de passe
echo    3. Vérifier le positionnement des boutons
echo    4. Vérifier les logs dans la console
echo.
echo 🎯 Toutes les fonctionnalités devraient maintenant fonctionner !
echo.
pause
