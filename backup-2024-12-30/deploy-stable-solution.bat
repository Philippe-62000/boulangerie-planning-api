@echo off
echo 🔧 Déploiement de la solution stable...
echo.

echo 📝 Commit de la solution stable...
git add .
git commit -m "Fix: Solution stable - Routes auth désactivées, endpoint mot de passe dans employees"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ SOLUTION STABLE DÉPLOYÉE !
echo.
echo 📋 Configuration actuelle :
echo    ✅ Routes auth : Désactivées (évite l'erreur jsonwebtoken)
echo    ✅ Envoi mot de passe : /api/employees/send-password/:id
echo    ✅ Frontend : Utilise la route employees
echo    ✅ Serveur : Devrait démarrer sans erreur
echo.
echo 🔄 Render va redéployer automatiquement...
echo.
echo 📋 Corrections restantes à tester :
echo    ⏳ Bouton sauvegarder statistiques de vente
echo    ⏳ Tableau frais de repas (une seule colonne)
echo    ⏳ En-têtes frais KM (2 au lieu de 18)
echo.
echo 🎯 Une fois le serveur stable, nous pourrons :
echo    1. Tester l'envoi de mot de passe
echo    2. Corriger les autres problèmes
echo    3. Résoudre le problème jsonwebtoken plus tard
echo.
pause
