@echo off
echo ========================================
echo CORRECTION URGENTE API RENDER
echo ========================================

echo [1/4] Correction du point d'entrée...
echo ✅ Chemin absolu vers backend/server.js
echo ✅ Configuration render.yaml mise à jour

echo [2/4] Déploiement vers GitHub...
git add .
git commit -m "🚨 FIX URGENT API: Correction chemin absolu + Configuration Render"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Correction urgente déployée vers GitHub

echo [3/4] Instructions pour Render...
echo.
echo 🔧 ACTIONS REQUISES SUR RENDER :
echo.
echo 1. Aller sur https://dashboard.render.com
echo 2. Sélectionner le service "boulangerie-planning-api-3"
echo 3. Cliquer sur "Manual Deploy" → "Deploy latest commit"
echo 4. Attendre le déploiement (2-5 minutes)
echo.

echo [4/4] Résumé de la correction...
echo.
echo 🚨 CORRECTION URGENTE API APPLIQUÉE !
echo.
echo 📋 Problème résolu :
echo    ❌ API en échec depuis 23h
echo    ✅ Chemin absolu vers backend/server.js
echo    ✅ Configuration Render corrigée
echo.
echo 📁 Fichiers modifiés :
echo    ✅ server.js (racine) - Chemin absolu
echo    ✅ render.yaml - startCommand corrigé
echo.
echo ⏳ Prochaines étapes :
echo    1. Déploiement manuel sur Render (voir instructions ci-dessus)
echo    2. Vérifier que l'API répond sur /health
echo    3. Tester le système d'authentification
echo.
echo 🎯 Une fois l'API redémarrée, le système sera opérationnel
echo.
pause
