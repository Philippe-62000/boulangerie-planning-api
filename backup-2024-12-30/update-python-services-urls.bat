@echo off
echo 🔄 Mise à jour des URLs des services Python Render...
echo.

echo 📝 Mise à jour du planningController.js...

REM Mise à jour des URLs des services Python dans le backend
powershell -Command "(Get-Content 'backend\controllers\planningController.js') -replace 'constraint-calculator\.onrender\.com', 'constraint-calculator-pbfy.onrender.com' | Set-Content 'backend\controllers\planningController.js'"
powershell -Command "(Get-Content 'backend\controllers\planningController.js') -replace 'planning-generator\.onrender\.com', 'planning-generator-pbfy.onrender.com' | Set-Content 'backend\controllers\planningController.js'"

echo ✅ URLs des services Python mises à jour !
echo.
echo 🚀 Nouvelles URLs configurées :
echo    - Constraint Calculator: https://constraint-calculator-pbfy.onrender.com
echo    - Planning Generator: https://planning-generator-pbfy.onrender.com
echo    - API Node.js: https://boulangerie-planning-api-4-pbfy.onrender.com
echo.
echo 📋 Prochaines étapes :
echo    1. Vérifier que les services Python sont accessibles
echo    2. Configurer les variables d'environnement SMTP sur l'API Node.js
echo    3. Tester la génération de planning
echo.
pause
