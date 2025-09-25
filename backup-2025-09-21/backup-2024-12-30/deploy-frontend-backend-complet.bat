@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT FRONTEND + BACKEND COMPLET
echo ========================================
echo.

echo 📋 Corrections appliquées:
echo ✅ Frontend: Champ Tuteur + Interface moderne
echo ✅ Backend: Modèle MongoDB mis à jour
echo ✅ Sélecteurs mois/année dans état des absences
echo ✅ Logs de debug pour les paramètres
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
echo ✅ DÉPLOIEMENT FRONTEND PRÊT !
echo.

echo 🚀 Étape 3: Déploiement Backend...
echo.

echo 📤 Upload du modèle Employee.js mis à jour...
echo ⚠️  IMPORTANT: Le backend doit être redéployé sur Render
echo ⚠️  avec le nouveau modèle Employee.js qui contient le champ 'tutor'
echo.

echo 📁 Contenu du dossier deploy-ovh:
dir deploy-ovh

echo.
echo 🎯 INSTRUCTIONS COMPLÈTES:
echo.
echo 1. 📤 FRONTEND - UPLOADEZ sur OVH:
echo    - Tout le contenu de deploy-ovh/ dans /plan/
echo    - URL: https://www.filmara.fr/plan/
echo.
echo 2. 🔧 BACKEND - REDÉPLOYEZ sur Render:
echo    - Le fichier backend/models/Employee.js a été modifié
echo    - Il contient maintenant le champ 'tutor'
echo    - Redéployez votre backend sur Render
echo.
echo 3. 🧪 TESTS FINAUX:
echo    ✅ Créer un apprenti avec tuteur
echo    ✅ Vérifier l'état des absences avec sélecteurs
echo    ✅ Tester la sauvegarde des paramètres
echo.
echo 🎉 DÉPLOIEMENT COMPLET PRÊT !
echo.
pause


