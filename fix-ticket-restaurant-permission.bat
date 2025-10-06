@echo off
echo 🔧 Correction de la permission ticket-restaurant...

echo.
echo 📦 Ajout de la permission manquante dans la base de données...
cd backend
node scripts/add-ticket-restaurant-permission.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'ajout de la permission
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Permission ticket-restaurant ajoutée !
echo.
echo 🎯 Le menu Ticket restaurant devrait maintenant apparaître correctement
echo    dans la sidebar après rechargement de la page.
echo.
echo 📋 Vérifications à faire :
echo    1. Recharger la page web
echo    2. Vérifier que le menu "🎫 Ticket restaurant" apparaît
echo    3. Tester l'accès à la page /ticket-restaurant
echo.
pause




