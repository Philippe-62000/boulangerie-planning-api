@echo off
echo ========================================
echo 🚨 DÉPLOIEMENT CORRECTIONS URGENTES
echo ========================================
echo.

echo 📋 Corrections appliquées:
echo ✅ Erreur t.filter corrigée dans AbsenceStatus.js
echo ✅ Boutons mois/année déplacés à côté du titre frais repas
echo ✅ Premier tableau des paramètres complètement supprimé
echo ✅ Interface paramètres modernisée (liste au lieu de tableau)
echo ✅ Sauvegarde paramètres avec validation et logs détaillés
echo ✅ Page frais KM avec logs de débogage complets
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
echo 🎯 INSTRUCTIONS URGENTES:
echo.
echo 1. 📤 UPLOADEZ TOUT le contenu de deploy-ovh/ sur OVH
echo    - Dans le dossier /plan/ de votre site
echo.
echo 2. 🌐 L'URL sera: https://www.filmara.fr/plan/
echo.
echo 3. 🧪 TESTS URGENTS À EFFECTUER:
echo    ✅ Menu "État des absences" (plus d'erreur t.filter)
echo    ✅ Frais repas: boutons mois/année à côté du titre
echo    ✅ Paramètres: interface moderne sans premier tableau
echo    ✅ Sauvegarde paramètres avec logs détaillés
echo    ✅ Page frais KM avec logs de débogage
echo.
echo 4. 🔍 EN CAS DE PROBLÈME:
echo    - Ouvrez la console du navigateur (F12)
echo    - Regardez les logs détaillés
echo    - Videz le cache navigateur (Ctrl+F5)
echo.
echo 🎉 TOUTES LES CORRECTIONS URGENTES SONT APPLIQUÉES !
echo.
pause


