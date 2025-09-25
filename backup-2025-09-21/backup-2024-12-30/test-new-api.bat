@echo off
echo 🧪 Test de la nouvelle API Render...
echo.

echo 📡 Test de l'API principale...
curl -s "https://boulangerie-planning-api-4-pbfy.onrender.com/api/employees" | findstr "success"
if %errorlevel% equ 0 (
    echo ✅ API principale : OK
) else (
    echo ❌ API principale : ERREUR
)

echo.
echo 🧮 Test du Constraint Calculator...
curl -s "https://constraint-calculator-pbfy.onrender.com/health" | findstr "ok"
if %errorlevel% equ 0 (
    echo ✅ Constraint Calculator : OK
) else (
    echo ❌ Constraint Calculator : ERREUR
)

echo.
echo 🚀 Test du Planning Generator...
curl -s "https://planning-generator-pbfy.onrender.com/health" | findstr "ok"
if %errorlevel% equ 0 (
    echo ✅ Planning Generator : OK
) else (
    echo ❌ Planning Generator : ERREUR
)

echo.
echo 📧 Test de la configuration email...
curl -s "https://boulangerie-planning-api-4-pbfy.onrender.com/api/parameters" | findstr "accountantEmail"
if %errorlevel% equ 0 (
    echo ✅ Configuration email : OK
) else (
    echo ❌ Configuration email : ERREUR
)

echo.
echo 🎉 Résumé des tests :
echo    - API Node.js : https://boulangerie-planning-api-4-pbfy.onrender.com
echo    - Constraint Calculator : https://constraint-calculator-pbfy.onrender.com
echo    - Planning Generator : https://planning-generator-pbfy.onrender.com
echo.
echo 📋 Prochaines étapes :
echo    1. Tester l'upload d'arrêts maladie
echo    2. Vérifier les notifications email
echo    3. Tester la génération de planning
echo.
pause
