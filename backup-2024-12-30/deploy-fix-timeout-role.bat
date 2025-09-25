@echo off
echo ========================================
echo CORRECTION TIMEOUT ET RÔLE
echo ========================================

echo [1/4] Diagnostic des problèmes...
echo ❌ Problème 1: Timeout 60s - Render en mode sleep
echo ❌ Problème 2: Rôle utilisateur undefined
echo ❌ Problème 3: Menu permissions vides
echo ❌ Problème 4: Dashboard vide

echo [2/4] Corrections appliquées...
echo ✅ Timeout: augmentation à 120s et retry logic
echo ✅ Rôle: correction contexte AuthContext
echo ✅ Menu: fallback permissions par défaut
echo ✅ Dashboard: gestion erreurs améliorée

echo [3/4] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [4/4] Préparation du déploiement OVH...
cd ..
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh
xcopy /e /i /y frontend\build\* deploy-ovh\
copy .htaccess-ovh-fixed deploy-ovh\.htaccess
echo ✅ Dossier deploy-ovh préparé

echo.
echo 🎉 CORRECTIONS TIMEOUT ET RÔLE APPLIQUÉES !
echo.
echo 📋 Corrections apportées :
echo    ✅ Timeout: augmentation à 120s avec retry
echo    ✅ Rôle: correction contexte AuthContext
echo    ✅ Menu: fallback permissions par défaut
echo    ✅ Dashboard: gestion erreurs améliorée
echo.
echo 🔧 Backend : Render.com (déjà déployé)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload OVH :
echo    1. Attendre 2-3 minutes que Render se réveille
echo    2. Recharger la page plusieurs fois si timeout
echo    3. Vérifier que le rôle utilisateur s'affiche
echo    4. Vérifier que les menus s'affichent
echo    5. Vérifier que le dashboard se charge
echo.
echo ⚠️  IMPORTANT: Render gratuit se met en veille après 15min
echo    Si timeout, attendre 2-3 minutes et recharger
echo.
echo 🎯 Les corrections sont prêtes !
echo.
pause
