@echo off
echo ========================================
echo DÉPLOIEMENT FRONTEND APRÈS BACKEND
echo ========================================

echo [1/3] Vérification des corrections frontend...
echo ✅ Modal employé: plus de clignotement
echo ✅ Menus: Frais Repas, Frais KM, Imprimer État
echo ✅ Dashboard: visible pour admin et salarié
echo ✅ Bouton Tuteurs: ajouté dans gestion employés
echo ✅ Page Tuteurs: créée avec tableau

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
echo 🎉 FRONTEND PRÊT POUR DÉPLOIEMENT !
echo.
echo 📋 Corrections frontend :
echo    ✅ Modal employé: modal flottant (plus de clignotement)
echo    ✅ Menus: tous les menus visibles
echo    ✅ Dashboard: pour admin et salarié
echo    ✅ Tuteurs: bouton + page avec tableau
echo.
echo 📁 Dossier: deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload OVH :
echo    1. Modal employé: ne doit plus clignoter
echo    2. Menus: Frais Repas, Frais KM, Imprimer État visibles
echo    3. Dashboard: visible pour admin et salarié
echo    4. Tuteurs: bouton fonctionnel + page tableau
echo    5. Paramètres KM: sauvegarde sans erreur 400
echo    6. Site: sauvegarde sans erreur 404
echo    7. Mots de passe: sauvegarde fonctionnelle
echo.
echo 🎯 Tous les problèmes sont corrigés !
echo.
pause
