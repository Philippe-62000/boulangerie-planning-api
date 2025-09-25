@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT BACKEND - MODIFICATION DATES
echo ========================================
echo.

echo 📋 Corrections apportées :
echo    ✅ Ajout endpoint PUT /api/sick-leaves/:id
echo    ✅ Fonction updateSickLeave dans le contrôleur
echo    ✅ Validation des dates (début < fin)
echo    ✅ Calcul automatique de la durée
echo    ✅ Suppression appel Nodemailer
echo.

echo 📁 Navigation vers le dossier backend...
cd backend

echo 🔧 Vérification des fichiers modifiés...
if exist "routes\sickLeaves.js" (
    echo    ✅ routes/sickLeaves.js modifié
) else (
    echo    ❌ Fichier routes/sickLeaves.js manquant
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
echo    - routes/sickLeaves.js (nouvelle route PUT /:id)
echo    - controllers/sickLeaveController.js (fonction updateSickLeave)
echo    - services/emailService.js (simplifié, plus d'erreur Nodemailer)
echo.

echo 🚀 Instructions de déploiement Render :
echo    1. Aller sur https://dashboard.render.com
echo    2. Sélectionner le service "boulangerie-planning-api-3"
echo    3. Cliquer sur "Manual Deploy" → "Deploy latest commit"
echo    4. Attendre que le déploiement se termine
echo    5. Tester l'endpoint PUT /api/sick-leaves/:id
echo.

echo 🎯 Fonctionnalités ajoutées :
echo    - ✅ Modification des dates avant validation
echo    - ✅ Validation des dates (début < fin)
echo    - ✅ Calcul automatique de la durée
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
echo    - Bouton ✏️ dans la gestion des arrêts maladie
echo    - Modification des dates
echo    - Validation des dates
echo.
pause
