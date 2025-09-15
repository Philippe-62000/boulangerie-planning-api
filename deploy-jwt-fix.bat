@echo off
echo 🔑 Déploiement avec JWT_SECRET fix...
echo.

echo 📝 Commit pour réactiver les routes auth...
git add .
git commit -m "Fix: Réactivation routes auth - JWT_SECRET doit être ajouté sur Render"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ ROUTES AUTH RÉACTIVÉES !
echo.
echo ⚠️  IMPORTANT : Ajoutez ces variables sur Render AVANT le déploiement :
echo.
echo    🌐 Allez sur https://dashboard.render.com
echo    🔍 Sélectionnez "boulangerie-planning-api-4-pbfy"
echo    ⚙️ Cliquez sur "Environment"
echo    ➕ Ajoutez ces variables :
echo.
echo    JWT_SECRET=votre-cle-secrete-jwt-super-secure-2024
echo    NODE_ENV=production
echo.
echo 💾 Sauvegardez et redéployez
echo.
echo 🔄 Render va redéployer automatiquement...
echo.
echo 🎯 Si JWT_SECRET est ajouté, tout devrait fonctionner !
echo    Sinon, le serveur plantera avec l'erreur jsonwebtoken
echo.
pause
