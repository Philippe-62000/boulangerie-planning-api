@echo off
echo 🎫 Déploiement de la correction Ticket Restaurant...

echo.
echo 🔧 Étape 1: Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 🔧 Étape 2: Ajout de la permission manquante...
echo    (Cette étape peut échouer si l'API n'est pas accessible)
cd backend
node scripts/add-ticket-restaurant-api.js
cd ..

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 Actions à effectuer :
echo    1. Redémarrer le serveur backend si nécessaire
echo    2. Recharger la page web
echo    3. Vérifier que le menu "🎫 Ticket restaurant" apparaît
echo    4. Tester l'accès à la page /ticket-restaurant
echo.
echo 📋 Si le menu n'apparaît toujours pas :
echo    - Aller dans Paramètres → Permissions de menu
echo    - Vérifier que "Ticket restaurant" est visible
echo    - Activer les permissions si nécessaire
echo.
pause




