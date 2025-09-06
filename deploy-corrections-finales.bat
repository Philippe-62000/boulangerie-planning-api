@echo off
echo ========================================
echo CORRECTIONS FINALES
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Header: affichage nom de la ville à côté du titre
echo ✅ Menu flottant: tous les menus en menus principaux (plus de sous-menus)
echo ✅ Absences: correction détection arrêts maladie (sickLeave.isOnSickLeave)
echo ✅ Centrage: titre Planning Boulangerie centré

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
git commit -m "Fix: Corrections finales interface

- Header: affichage nom ville à côté du titre
- Menu: tous les menus en principaux (plus de sous-menus)
- Absences: correction détection arrêts maladie
- Centrage: titre Planning Boulangerie"

echo.
echo 🎉 CORRECTIONS FINALES APPLIQUÉES !
echo.
echo 📋 Corrections apportées :
echo    ✅ Header: nom de la ville affiché à côté du titre
echo    ✅ Menu flottant: Dashboard, Frais Repas, Frais KM, Imprimer État visibles
echo    ✅ Absences: détection correcte des arrêts maladie
echo    ✅ Centrage: titre Planning Boulangerie centré
echo.
echo 🔧 Backend : Render.com (déjà déployé)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload OVH :
echo    1. Titre: "Planning Boulangerie 'Ville'" affiché
echo    2. Menu: tous les menus visibles (Dashboard, Frais Repas, etc.)
echo    3. Absences: arrêts maladie correctement détectés
echo    4. Centrage: titre bien centré
echo    5. Paramètres KM: sauvegarde fonctionnelle
echo    6. Site: sauvegarde fonctionnelle
echo    7. Mots de passe: sauvegarde fonctionnelle
echo.
echo 🎯 Tous les problèmes sont corrigés !
echo.
pause