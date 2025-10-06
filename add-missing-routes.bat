@echo off
echo 🔧 Ajout des routes manquantes au backend...

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

echo ✅ Fichiers backend présents

echo.
echo 📦 Étape 2: Vérification de la route dans server.js...
findstr /C:"ticket-restaurant" backend\server.js >nul
if %errorlevel% neq 0 (
    echo ❌ Route manquante dans server.js
    echo 🔧 Ajout de la route...
    echo. >> backend\server.js
    echo app.use('/api/ticket-restaurant', require('./routes/ticketRestaurant')); >> backend\server.js
    echo ✅ Route ajoutée
) else (
    echo ✅ Route trouvée dans server.js
)

echo.
echo 📦 Étape 3: Vérification des autres routes manquantes...
findstr /C:"delays" backend\server.js >nul
if %errorlevel% neq 0 (
    echo ❌ Route delays manquante
    echo 🔧 Ajout de la route...
    echo app.use('/api/delays', require('./routes/delays')); >> backend\server.js
    echo ✅ Route delays ajoutée
) else (
    echo ✅ Route delays trouvée
)

findstr /C:"vacation-requests" backend\server.js >nul
if %errorlevel% neq 0 (
    echo ❌ Route vacation-requests manquante
    echo 🔧 Ajout de la route...
    echo app.use('/api/vacation-requests', require('./routes/vacationRequests')); >> backend\server.js
    echo ✅ Route vacation-requests ajoutée
) else (
    echo ✅ Route vacation-requests trouvée
)

echo.
echo 📦 Étape 4: Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Routes ajoutées !
echo.
echo 🎯 ACTIONS À EFFECTUER :
echo.
echo 1. 📁 Aller sur le dashboard Render
echo 2. 🔄 Redémarrer le service backend
echo 3. 📋 Vérifier les logs de déploiement
echo 4. 🧪 Tester l'API avec : test-ticket-api.bat
echo.
echo 📋 Nouvelles routes ajoutées :
echo    - /api/ticket-restaurant
echo    - /api/delays
echo    - /api/vacation-requests
echo.
echo 🧪 Après redémarrage, tester le bouton "Simuler scan"
echo.
pause



