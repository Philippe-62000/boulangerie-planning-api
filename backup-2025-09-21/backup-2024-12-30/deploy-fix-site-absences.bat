@echo off
echo ========================================
echo CORRECTION SITE + ABSENCES + SYNTAXE
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Modèle Site créé avec API
echo ✅ Interface gestion site dans Paramètres
echo ✅ Correction calcul des arrêts maladie
echo ✅ Correction syntaxe Employee.js
echo ✅ Logs de debug pour absences

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
git commit -m "🏪 CORRECTION SITE + ABSENCES: Modèle Site + Interface + Calcul arrêts maladie + Syntaxe Employee"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 CORRECTIONS SITE + ABSENCES APPLIQUÉES !
echo.
echo 📋 Fonctionnalités ajoutées :
echo    ✅ Modèle Site avec nom et ville
echo    ✅ Interface gestion site dans Paramètres
echo    ✅ Correction calcul des arrêts maladie
echo    ✅ Logs de debug pour identifier les problèmes
echo    ✅ Correction syntaxe Employee.js
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload :
echo    1. Configurer le nom et la ville du site
echo    2. Vérifier l'affichage des arrêts maladie
echo    3. Tester la sauvegarde des paramètres KM
echo    4. Vérifier les logs de debug dans la console
echo.
echo 🎯 Les arrêts maladie devraient maintenant s'afficher !
echo.
pause
