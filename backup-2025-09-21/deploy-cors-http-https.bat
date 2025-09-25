@echo off
echo ========================================
echo CORRECTION CORS HTTP/HTTPS
echo ========================================

echo [1/3] Correction CORS HTTP/HTTPS appliquée...
echo ✅ Configuration CORS améliorée avec fonction de validation
echo ✅ Support complet HTTP et HTTPS
echo ✅ Logs détaillés pour debug CORS

echo [2/3] Commit et push vers Git (Render)...
git add backend/server.js
git commit -m "Fix: Configuration CORS améliorée pour HTTP/HTTPS"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo ✅ CORRECTION CORS HTTP/HTTPS DÉPLOYÉE !
echo.
echo 🔧 Corrections appliquées :
echo    ✅ Fonction de validation CORS personnalisée
echo    ✅ Support HTTP et HTTPS complet
echo    ✅ Logs détaillés pour debug
echo    ✅ Headers et méthodes CORS explicites
echo.
echo 🧪 Tests après déploiement :
echo    1. .\test-http-https.bat
echo    2. Test avec http://filmara.fr (menus + contenu)
echo    3. Test avec https://filmara.fr (menus + contenu)
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
pause
