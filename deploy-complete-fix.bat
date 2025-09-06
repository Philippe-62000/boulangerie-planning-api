@echo off
echo ========================================
echo CORRECTION COMPLÈTE - MENUS + PERMISSIONS
echo ========================================

echo [1/5] Corrections appliquées...
echo ✅ Logs de debug dans Sidebar.js
echo ✅ Interface gestion permissions dans Paramètres
echo ✅ Correction API mots de passe avec logs
echo ✅ Styles CSS pour permissions
echo ✅ Tous les menus configurés

echo [2/5] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [3/5] Préparation du déploiement OVH...
cd ..
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh
xcopy /e /i /y frontend\build\* deploy-ovh\
copy .htaccess-ovh-fixed deploy-ovh\.htaccess
echo ✅ Dossier deploy-ovh préparé

echo [4/5] Déploiement vers GitHub...
git add .
git commit -m "🔧 CORRECTION COMPLÈTE: Debug menus + Interface permissions + API mots de passe"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo [5/5] Instructions de test...
echo.
echo 🎉 CORRECTIONS COMPLÈTES APPLIQUÉES !
echo.
echo 📋 Fonctionnalités ajoutées :
echo    ✅ Logs de debug pour identifier les problèmes de menus
echo    ✅ Interface de gestion des permissions dans Paramètres
echo    ✅ Correction API mots de passe avec logs détaillés
echo    ✅ Tous les menus configurés (Dashboard, Constraints, etc.)
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests à effectuer après upload :
echo    1. Se connecter en tant qu'administrateur
echo    2. Vérifier que tous les menus s'affichent
echo    3. Aller dans Paramètres → Gestion des Permissions
echo    4. Configurer les permissions pour les salariés
echo    5. Tester la modification des mots de passe
echo    6. Se connecter en tant que salarié et vérifier les menus
echo.
echo 📊 Logs de debug disponibles dans la console du navigateur
echo.
pause
