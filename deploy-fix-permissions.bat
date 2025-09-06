@echo off
echo ========================================
echo CORRECTION PERMISSIONS MANQUANTES
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Route pour recréer les permissions par défaut
echo ✅ Bouton "Recréer les permissions" dans l'interface
echo ✅ Correction des permissions manquantes (dashboard, constraints, etc.)

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
git commit -m "🔧 CORRECTION PERMISSIONS: Route recréation + Bouton interface + Permissions manquantes"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 CORRECTIONS PERMISSIONS APPLIQUÉES !
echo.
echo 📋 Corrections :
echo    ✅ Route POST /menu-permissions/recreate
echo    ✅ Bouton "Recréer les permissions par défaut"
echo    ✅ Correction des permissions manquantes
echo    ✅ Tous les menus maintenant configurés
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Instructions après upload :
echo    1. Se connecter en tant qu'administrateur
echo    2. Aller dans Paramètres → Gestion des Permissions
echo    3. Cliquer "Recréer les permissions par défaut"
echo    4. Vérifier que tous les menus s'affichent
echo    5. Configurer les permissions pour les salariés
echo.
echo 🎯 Tous les menus devraient maintenant s'afficher !
echo.
pause