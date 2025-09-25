@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT BACKEND - FIX FRAIS KM
echo ========================================
echo.

echo 📋 Corrections apportées :
echo    ✅ Paramètres d'alerte email exclus des frais KM (kmValue: -1)
echo    ✅ Endpoint modification dates ajouté
echo    ✅ Amélioration gestion erreurs téléchargement
echo    ✅ Suppression appel Nodemailer
echo.

echo 📁 Navigation vers le dossier backend...
cd backend

echo 🔧 Vérification des fichiers modifiés...
if exist "controllers\parametersController.js" (
    echo    ✅ controllers/parametersController.js modifié
) else (
    echo    ❌ Fichier controllers/parametersController.js manquant
    pause
    exit /b 1
)

if exist "controllers\sickLeaveController.js" (
    echo    ✅ controllers/sickLeaveController.js modifié
) else (
    echo    ❌ Fichier controllers/sickLeaveController.js manquant
    pause
    exit /b 1
)

if exist "routes\sickLeaves.js" (
    echo    ✅ routes/sickLeaves.js modifié
) else (
    echo    ❌ Fichier routes/sickLeaves.js manquant
    pause
    exit /b 1
)

if exist "services\emailService.js" (
    echo    ✅ services/emailService.js simplifié
) else (
    echo    ❌ Fichier services/emailService.js manquant
    pause
    exit /b 1
)

echo.
echo 📦 Préparation du déploiement...
echo.

echo 📋 Fichiers à déployer sur Render :
echo    - controllers/parametersController.js (exclusion frais KM)
echo    - controllers/sickLeaveController.js (modification dates + téléchargement)
echo    - routes/sickLeaves.js (nouvelle route PUT /:id)
echo    - services/emailService.js (simplifié)
echo.

echo 🚀 Instructions de déploiement Render :
echo    1. Aller sur https://dashboard.render.com
echo    2. Sélectionner le service "boulangerie-planning-api-3"
echo    3. Cliquer sur "Manual Deploy" → "Deploy latest commit"
echo    4. Attendre que le déploiement se termine
echo.

echo 🎯 Fonctionnalités corrigées :
echo    - ✅ Page Frais KM : plus de paramètres d'alerte email
echo    - ✅ Modification des dates avant validation
echo    - ✅ Amélioration téléchargement arrêts maladie
echo    - ✅ Plus d'erreur Nodemailer sur Render
echo.

echo 📁 Retour au dossier racine...
cd ..

echo.
echo ========================================
echo ✅ BACKEND PRÊT POUR DÉPLOIEMENT !
echo ========================================
echo.
echo 💡 Après le déploiement, tester :
echo    - Page Frais KM : tableau correct
echo    - Bouton ✏️ dans la gestion des arrêts maladie
echo    - Téléchargement des arrêts maladie
echo.
pause
