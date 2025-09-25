@echo off
echo 🔧 Déploiement de la solution temporaire...
echo.

echo 📝 Commit de la solution temporaire pour jsonwebtoken...
git add .
git commit -m "Fix: Solution temporaire - Routes auth désactivées, endpoint mot de passe dans employees"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ SOLUTION TEMPORAIRE DÉPLOYÉE !
echo.
echo 📋 Corrections appliquées :
echo    ✅ Routes auth : Temporairement désactivées (problème jsonwebtoken)
echo    ✅ Envoi mot de passe : Nouvel endpoint /api/employees/send-password/:id
echo    ✅ Frontend : Mis à jour pour utiliser la nouvelle route
echo.
echo 🔄 Render va redéployer automatiquement...
echo.
echo ⚠️  TEMPORAIRE :
echo    - L'authentification JWT est désactivée
echo    - L'envoi de mot de passe fonctionne mais en mode simulation
echo    - Le mot de passe est affiché dans la console du serveur
echo.
echo 🎯 Testez maintenant :
echo    1. Le serveur devrait démarrer sans erreur
echo    2. L'envoi de mot de passe devrait fonctionner
echo    3. Toutes les autres fonctionnalités devraient marcher
echo.
pause
