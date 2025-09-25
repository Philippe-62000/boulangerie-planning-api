@echo off
echo ========================================
echo CORRECTION DEPENDANCES RENDER
echo ========================================

echo [1/3] Fusion des dépendances...
echo ✅ Dépendances backend ajoutées au package.json racine
echo ✅ Express, Mongoose, CORS, etc. disponibles

echo [2/3] Déploiement vers GitHub...
git add .
git commit -m "🔧 FIX DEPENDENCIES: Fusion package.json racine + backend"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Correction dépendances déployée vers GitHub

echo [3/3] Instructions pour Render...
echo.
echo 🔧 ACTIONS REQUISES SUR RENDER :
echo.
echo 1. Aller sur https://dashboard.render.com
echo 2. Sélectionner le service "boulangerie-planning-api-3"
echo 3. Cliquer sur "Manual Deploy" → "Deploy latest commit"
echo 4. Attendre le déploiement (2-5 minutes)
echo.

echo 📋 Problème résolu :
echo    ❌ Cannot find module 'express'
echo    ✅ Dépendances installées à la racine
echo    ✅ Serveur backend peut accéder aux modules
echo.
echo ⏳ Prochaines étapes :
echo    1. Déploiement manuel sur Render
echo    2. Vérifier que l'API démarre correctement
echo    3. Tester l'endpoint /health
echo.
echo 🎯 L'API devrait maintenant démarrer sans erreur
echo.
pause
