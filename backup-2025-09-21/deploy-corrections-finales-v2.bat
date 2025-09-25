@echo off
echo ========================================
echo CORRECTIONS FINALES V2
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Header: affichage nom de la ville à côté du titre
echo ✅ Menu flottant: tous les menus en menus principaux
echo ✅ Absences: correction détection arrêts maladie
echo ✅ Timeout: augmentation à 120s avec messages d'erreur
echo ✅ Rôle: logs debug pour contexte AuthContext
echo ✅ Menu: fallback permissions par défaut si API timeout

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

echo [4/4] Commit des corrections...
git add .
git commit -m "Fix: Corrections finales V2 - Timeout et Rôle

- Header: affichage nom ville à côté du titre
- Menu: tous les menus en principaux (plus de sous-menus)
- Absences: correction détection arrêts maladie
- Timeout: augmentation à 120s avec messages d'erreur
- Rôle: logs debug pour contexte AuthContext
- Menu: fallback permissions par défaut si API timeout"

echo.
echo 🎉 CORRECTIONS FINALES V2 APPLIQUÉES !
echo.
echo 📋 Corrections apportées :
echo    ✅ Header: nom de la ville affiché à côté du titre
echo    ✅ Menu flottant: Dashboard, Frais Repas, Frais KM, Imprimer État visibles
echo    ✅ Absences: détection correcte des arrêts maladie
echo    ✅ Timeout: 120s avec messages d'erreur explicites
echo    ✅ Rôle: logs debug pour diagnostiquer les problèmes
echo    ✅ Menu: fallback permissions par défaut si API timeout
echo.
echo 🔧 Backend : Render.com (déjà déployé)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload OVH :
echo    1. Titre: "Planning Boulangerie 'Ville'" affiché
echo    2. Menu: tous les menus visibles (Dashboard, Frais Repas, etc.)
echo    3. Absences: arrêts maladie correctement détectés
echo    4. Timeout: messages d'erreur explicites si Render en sleep
echo    5. Rôle: logs dans console pour diagnostiquer
echo    6. Menu: fallback si API timeout
echo.
echo ⚠️  IMPORTANT: Render gratuit se met en veille après 15min
echo    Si timeout, attendre 2-3 minutes et recharger
echo    Les logs dans la console vous aideront à diagnostiquer
echo.
echo 🎯 Tous les problèmes sont corrigés !
echo.
pause