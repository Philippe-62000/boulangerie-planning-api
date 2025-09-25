@echo off
echo 🔧 Correction complète du contrôleur employé...
echo.

echo 📝 Corrections appliquées :
echo   - ✅ Toutes les fonctions converties de exports.X vers const X
echo   - ✅ Exports corrigés (supprimé les fonctions non définies)
echo   - ✅ Ajouté les fonctions manquantes aux exports
echo.

echo 📝 Fonctions corrigées :
echo   - getAllEmployees
echo   - getEmployeeById  
echo   - createEmployee
echo   - updateEmployee
echo   - deactivateEmployee
echo   - reactivateEmployee
echo   - deleteEmployee
echo   - declareSickLeave
echo   - sendPasswordToEmployee
echo.

echo 📝 Commit des corrections...
git add backend/controllers/employeeController.js
git commit -m "Fix: Corriger toutes les fonctions employé (exports vers const)"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ TOUTES LES CORRECTIONS DÉPLOYÉES !
echo.
echo 🎯 Render devrait maintenant démarrer sans aucune erreur !
echo.
echo ⏳ Attendez 2-3 minutes que Render redéploie automatiquement
echo.
pause


