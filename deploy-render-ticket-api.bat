@echo off
echo 🚀 Déploiement sur Render - API Ticket Restaurant...

echo.
echo 📦 Étape 1: Vérification des fichiers...
if not exist "backend\models\TicketRestaurant.js" (
    echo ❌ Fichier TicketRestaurant.js manquant
    pause
    exit /b 1
)
if not exist "backend\routes\ticketRestaurant.js" (
    echo ❌ Fichier ticketRestaurant.js manquant
    pause
    exit /b 1
)
if not exist "backend\server.js" (
    echo ❌ Fichier server.js manquant
    pause
    exit /b 1
)

echo ✅ Tous les fichiers backend sont présents

echo.
echo 📦 Étape 2: Vérification de la configuration server.js...
findstr /C:"ticket-restaurant" backend\server.js >nul
if %errorlevel% neq 0 (
    echo ❌ Route ticket-restaurant non ajoutée dans server.js
    echo 🔧 Ajout de la route...
    echo app.use('/api/ticket-restaurant', require('./routes/ticketRestaurant')); >> backend\server.js
) else (
    echo ✅ Route ticket-restaurant trouvée dans server.js
)

echo.
echo 📦 Étape 3: Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Déploiement prêt !
echo.
echo 🎯 Actions à effectuer sur Render :
echo    1. Aller sur le dashboard Render
echo    2. Redémarrer le service backend
echo    3. Vérifier les logs de déploiement
echo    4. Tester l'API avec : test-ticket-api.bat
echo.
echo 📋 Routes API à vérifier :
echo    - GET /api/ticket-restaurant?month=YYYY-MM
echo    - POST /api/ticket-restaurant
echo    - DELETE /api/ticket-restaurant/:id
echo    - GET /api/ticket-restaurant/stats/:month
echo.
echo 🧪 Après redémarrage, tester avec :
echo    test-ticket-api.bat
echo.
pause




