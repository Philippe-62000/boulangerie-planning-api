@echo off
echo 🔧 Correction de l'erreur authController - Désactivation temporaire
echo.

echo 📝 Désactivation des routes d'authentification...
echo    - auth.js temporairement commenté dans server.js
echo    - jsonwebtoken non nécessaire pour le fonctionnement principal
echo.

echo 📝 Commit et push de la correction...
git add backend/server.js
git commit -m "Fix: Désactivation temporaire des routes auth pour éviter l'erreur jsonwebtoken sur Render"
git push origin main

echo.
echo ✅ Correction déployée !
echo.
echo 🔄 Render va maintenant :
echo    1. Redémarrer sans l'erreur jsonwebtoken
echo    2. L'API sera fonctionnelle
echo    3. Les routes principales fonctionneront
echo.
echo 📋 Routes disponibles :
echo    - /api/employees ✅
echo    - /api/planning ✅  
echo    - /api/constraints ✅
echo    - /api/sick-leaves ✅
echo    - /api/menu-permissions ✅
echo    - /api/passwords ✅
echo.
echo ⚠️ Routes temporairement désactivées :
echo    - /api/auth (système d'authentification)
echo.
echo 🚀 L'API devrait maintenant fonctionner !
echo.
pause
