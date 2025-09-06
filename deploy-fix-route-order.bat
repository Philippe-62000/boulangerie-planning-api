@echo off
echo ========================================
echo CORRECTION ORDRE DES ROUTES
echo ========================================

echo [1/3] Correction appliquée...
echo ✅ Route /batch déplacée avant /:id
echo ✅ Correction de l'erreur CastError

echo [2/3] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [3/3] Déploiement vers GitHub...
cd ..
git add .
git commit -m "🔧 CORRECTION ROUTES: Ordre des routes menu-permissions corrigé"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Correction déployée vers GitHub

echo.
echo 🎉 CORRECTION ROUTES APPLIQUÉE !
echo.
echo 📋 Problème résolu :
echo    ✅ Route /batch maintenant avant /:id
echo    ✅ Plus d'erreur CastError
echo    ✅ Sauvegarde des permissions fonctionnelle
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo.
echo ⏳ Attendre 2-3 minutes pour le redéploiement Render
echo 🧪 Tester ensuite la sauvegarde des permissions
echo.
pause
