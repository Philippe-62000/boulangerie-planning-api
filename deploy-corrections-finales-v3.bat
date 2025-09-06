@echo off
echo ========================================
echo 🔧 DÉPLOIEMENT CORRECTIONS FINALES V3
echo ========================================
echo.

echo 📋 Corrections appliquées:
echo ✅ Logs détaillés pour debug paramètres (erreur 400)
echo ✅ Menu déroulant septembre agrandi dans frais repas
echo ✅ Modal modifier employé redesigné comme déclarer absence
echo ✅ Champ Tuteur ajouté pour les apprentis (MongoDB + Frontend)
echo ✅ Interface moderne avec form-label et form-control
echo.

echo 🚀 Étape 1: Build du frontend...
echo.

cd frontend
echo 📦 Build en cours...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ Build terminé avec succès !
echo.

echo 🚀 Étape 2: Préparation du déploiement...
echo.

echo 📁 Nettoyage du dossier deploy-ovh...
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh

echo.
echo 📄 Copie des fichiers buildés...
xcopy "frontend\build\*" "deploy-ovh\" /E /Y /Q

echo.
echo 📄 Copie du .htaccess robuste...
copy .htaccess-ovh-fixed deploy-ovh\.htaccess

echo.
echo ✅ DÉPLOIEMENT PRÊT !
echo.

echo 📁 Contenu du dossier deploy-ovh:
dir deploy-ovh

echo.
echo 🎯 INSTRUCTIONS FINALES V3:
echo.
echo 1. 📤 UPLOADEZ TOUT le contenu de deploy-ovh/ sur OVH
echo    - Dans le dossier /plan/ de votre site
echo.
echo 2. 🌐 L'URL sera: https://www.filmara.fr/plan/
echo.
echo 3. 🧪 TESTS FINAUX V3 À EFFECTUER:
echo    ✅ Paramètres: vérifier les logs détaillés pour l'erreur 400
echo    ✅ Frais repas: menu déroulant septembre agrandi
echo    ✅ Gestion employés: modal redesigné avec champ Tuteur
echo    ✅ Apprentis: sélection du tuteur dans la liste des employés
echo.
echo 4. 🔍 DEBUGGING:
echo    - Ouvrez la console (F12) pour voir les logs détaillés
echo    - Vérifiez la structure des données des paramètres
echo    - Testez la création/modification d'apprentis avec tuteur
echo.
echo 🎉 CORRECTIONS FINALES V3 APPLIQUÉES !
echo.
pause


