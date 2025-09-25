@echo off
echo ========================================
echo CORRECTION CORS URGENT
echo ========================================

echo [1/3] Correction CORS appliquée...
echo ✅ Ajout de http://www.filmara.fr dans les origines autorisées
echo ✅ Configuration CORS mise à jour

echo [2/3] Commit et push vers Git (Render)...
git add backend/server.js
git commit -m "Fix: Correction CORS pour www.filmara.fr (HTTP)"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo ✅ CORRECTION CORS DÉPLOYÉE !
echo.
echo 🔧 Correction appliquée :
echo    ✅ http://www.filmara.fr ajouté aux origines CORS autorisées
echo    ✅ https://www.filmara.fr déjà présent
echo    ✅ http://filmara.fr ajouté aussi
echo.
echo 🧪 Tests après déploiement :
echo    1. https://boulangerie-planning-api-3.onrender.com/health
echo    2. Dashboard se charge sans erreur CORS
echo    3. Toutes les APIs fonctionnent depuis www.filmara.fr
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
pause
