@echo off
echo 🔧 Correction du contrôleur employé et route mot de passe...
echo.

echo 📝 Corrections appliquées :
echo   - ✅ getAllEmployees défini correctement
echo   - ✅ Route envoi mot de passe corrigée
echo.

echo 📝 Commit des corrections...
git add backend/controllers/employeeController.js
git add frontend/src/pages/Employees.js
git commit -m "Fix: Corriger getAllEmployees non défini et route envoi mot de passe"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ CORRECTIONS DÉPLOYÉES !
echo.
echo 🎯 Render devrait maintenant :
echo   1. ✅ Démarrer sans erreur getAllEmployees
echo   2. ✅ Permettre l'envoi de mot de passe aux employés
echo.
echo ⏳ Attendez 2-3 minutes que Render redéploie automatiquement
echo.
pause


