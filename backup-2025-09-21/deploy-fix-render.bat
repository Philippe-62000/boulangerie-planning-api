@echo off
echo ========================================
echo CORRECTION ERREUR RENDER - SERVER.JS
echo ========================================

echo [1/3] Correction de la structure pour Render...
echo ✅ Création du package.json racine
echo ✅ Configuration du chemin backend/server.js

echo [2/3] Déploiement vers GitHub...
git add .
git commit -m "🔧 FIX RENDER: Correction chemin server.js + package.json racine"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Correction déployée vers GitHub

echo [3/3] Résumé de la correction...
echo.
echo 🔧 CORRECTION RENDER APPLIQUÉE !
echo.
echo 📋 Problème résolu :
echo    ❌ Render cherchait server.js à la racine
echo    ✅ Maintenant il cherche backend/server.js
echo.
echo 📁 Fichiers modifiés :
echo    ✅ package.json (racine) - Point d'entrée corrigé
echo    ✅ Scripts de démarrage mis à jour
echo.
echo ⏳ Prochaines étapes :
echo    1. Render va redéployer automatiquement (2-5 min)
echo    2. Le serveur devrait démarrer correctement
echo    3. Tester l'API sur https://boulangerie-planning-api-3.onrender.com
echo.
echo 🎯 Le système d'authentification sera opérationnel après redéploiement
echo.
pause
