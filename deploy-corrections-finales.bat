@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT CORRECTIONS FINALES
echo ========================================
echo.

echo 📋 Corrections appliquées:
echo ✅ Premier tableau supprimé des paramètres
echo ✅ Total frais repas déplacé à gauche près du nom
echo ✅ Menu déroulant frais repas repositionné
echo ✅ Frais KM première ligne Adélaïde corrigée
echo ✅ Menu état des absences corrigé
echo ✅ .htaccess robuste créé
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
echo 📄 Copie du .htaccess corrigé...
copy .htaccess-ovh-fixed deploy-ovh\.htaccess

echo.
echo ✅ DÉPLOIEMENT PRÊT !
echo.

echo 📁 Contenu du dossier deploy-ovh:
dir deploy-ovh

echo.
echo 🎯 INSTRUCTIONS FINALES:
echo.
echo 1. 📤 UPLOADEZ TOUT le contenu de deploy-ovh/ sur OVH
echo    - Dans le dossier /plan/ de votre site
echo.
echo 2. 🌐 L'URL sera: https://www.filmara.fr/plan/
echo.
echo 3. 🧪 TESTS À EFFECTUER:
echo    ✅ Sauvegarde des paramètres (plus d'erreur 400)
echo    ✅ Menu "État des absences" visible
echo    ✅ Premier tableau supprimé dans paramètres
echo    ✅ Total frais repas à gauche près du nom
echo    ✅ Menu déroulant frais repas repositionné
echo    ✅ Frais KM première ligne Adélaïde complète
echo    ✅ Navigation React Router fonctionnelle
echo.
echo 4. 🔄 Si problème, videz le cache navigateur (Ctrl+F5)
echo.
echo 🎉 TOUTES LES CORRECTIONS SONT APPLIQUÉES !
echo.
pause


