@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT CORRECTIONS FINALES COMPLÈTES
echo ========================================
echo.

echo 📋 Corrections apportées :
echo    ✅ Réduction paramètres Frais KM (5 au lieu de 12)
echo    ✅ Correction sauvegarde configuration alertes
echo    ✅ Endpoint modification dates arrêts maladie
echo    ✅ Amélioration téléchargement arrêts maladie
echo    ✅ Suppression appel Nodemailer
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 🧹 Nettoyage du build précédent...
if exist "build" (
    rmdir /s /q build
    echo    ✅ Ancien build supprimé
)

echo 🔨 Build de production...
npm run build

echo.
echo 📋 Vérification du build...
if exist "build\index.html" (
    echo    ✅ Build réussi - index.html créé
) else (
    echo    ❌ Erreur build - index.html manquant
    cd ..
    pause
    exit /b 1
)

echo.
echo 📁 Retour au dossier racine...
cd ..

echo.
echo ========================================
echo ✅ BUILD FRONTEND TERMINÉ !
echo ========================================
echo.
echo 📋 Fichiers générés dans frontend/build/ :
echo    - index.html (page principale)
echo    - static/css/main.xxx.css (styles)
echo    - static/js/main.xxx.js (JavaScript)
echo    - sick-leave-standalone.html (avec titre dynamique)
echo.
echo 🚀 Instructions de déploiement :
echo.
echo 1. 📤 BACKEND (Render) :
echo    - Aller sur https://dashboard.render.com
echo    - Sélectionner "boulangerie-planning-api-3"
echo    - Cliquer "Manual Deploy" → "Deploy latest commit"
echo    - Attendre la fin du déploiement
echo.
echo 2. 📤 FRONTEND (OVH) :
echo    - Copier TOUT le dossier "frontend\build\" sur OVH
echo    - Remplacer le contenu existant
echo    - Tester sur https://www.filmara.fr
echo.
echo 🎯 Corrections apportées :
echo    - ✅ Page Frais KM : seulement 5 paramètres (plus de 6-10)
echo    - ✅ Configuration alertes : sauvegarde fonctionnelle
echo    - ✅ Modification dates : bouton ✏️ fonctionnel
echo    - ✅ Téléchargement : bouton 📥 fonctionnel
echo    - ✅ Plus d'erreur Nodemailer sur Render
echo.
pause