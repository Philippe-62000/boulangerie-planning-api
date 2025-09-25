@echo off
echo ========================================
echo DÉPLOIEMENT HTTPS UNIQUEMENT
echo ========================================

echo [1/4] Configuration HTTPS uniquement...
echo ✅ Backend: CORS configuré pour HTTPS uniquement
echo ✅ Frontend: Page de redirection HTTP créée
echo ✅ .htaccess: Redirection automatique HTTP → HTTPS

echo [2/4] Build du frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)
cd ..

echo [3/4] Commit et push vers Git...
git add backend/server.js frontend/public/http-redirect.html frontend/public/.htaccess
git commit -m "Config: HTTPS uniquement avec redirection HTTP automatique"
git push origin main

echo [4/4] Instructions de déploiement OVH...
echo.
echo 📁 Fichiers à uploader sur OVH :
echo    - Tout le contenu du dossier frontend/build/
echo    - Vers le répertoire /plan/ sur votre hébergement OVH
echo.
echo 🔧 Configuration HTTPS uniquement :
echo    ✅ Backend accepte uniquement HTTPS
echo    ✅ Redirection automatique HTTP → HTTPS
echo    ✅ Page de redirection avec countdown
echo    ✅ Headers de sécurité renforcés
echo.
echo 🎯 Résultat attendu :
echo    - http://filmara.fr → redirection vers https://www.filmara.fr/plan/
echo    - https://filmara.fr → redirection vers https://www.filmara.fr/plan/
echo    - Tous les menus et contenus fonctionnent en HTTPS
echo.
echo ⚠️  IMPORTANT : 
echo    - Le backend a été configuré pour HTTPS uniquement
echo    - Toute tentative HTTP sera automatiquement redirigée
echo.
pause
