@echo off
echo ========================================
echo 🔧 DÉPLOIEMENT CORRECTIONS FINALES V2
echo ========================================
echo.

echo 📋 Corrections appliquées:
echo ✅ Logs détaillés pour debug des maladies dans AbsenceStatus
echo ✅ Erreur 400 paramètres corrigée (validation améliorée)
echo ✅ Ligne Adélaïde frais KM corrigée (largeur fixe 200px)
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
echo 🎯 INSTRUCTIONS FINALES V2:
echo.
echo 1. 📤 UPLOADEZ TOUT le contenu de deploy-ovh/ sur OVH
echo    - Dans le dossier /plan/ de votre site
echo.
echo 2. 🌐 L'URL sera: https://www.filmara.fr/plan/
echo.
echo 3. 🧪 TESTS FINAUX À EFFECTUER:
echo    ✅ État des absences: vérifier les logs pour les maladies
echo    ✅ Paramètres: sauvegarde sans erreur 400
echo    ✅ Frais KM: ligne Adélaïde complète et visible
echo.
echo 4. 🔍 DEBUGGING:
echo    - Ouvrez la console (F12) pour voir les logs détaillés
echo    - Vérifiez la structure des données d'absences
echo    - Testez la sauvegarde des paramètres
echo.
echo 🎉 CORRECTIONS FINALES V2 APPLIQUÉES !
echo.
pause


