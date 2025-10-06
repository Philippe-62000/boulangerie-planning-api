@echo off
echo 🔧 Correction des routes backend pour ticket-restaurant...

echo.
echo 🔍 Vérification des fichiers backend...
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

echo ✅ Fichiers backend présents

echo.
echo 🔍 Vérification de la route dans server.js...
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
echo 🔍 Vérification du modèle dans server.js...
findstr /C:"TicketRestaurant" backend\server.js >nul
if %errorlevel% neq 0 (
    echo ❌ Modèle TicketRestaurant non importé
    echo 🔧 Ajout de l'import...
    echo const TicketRestaurant = require('./models/TicketRestaurant'); >> backend\server.js
    echo ✅ Modèle ajouté
) else (
    echo ✅ Modèle trouvé dans server.js
)

echo.
echo 🔍 Vérification des autres routes manquantes...
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
echo 🔧 Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Routes backend corrigées !
echo.
echo 🎯 ACTIONS À EFFECTUER :
echo.
echo 1. 📁 Aller sur le dashboard Render
echo 2. 🔄 Redémarrer le service backend
echo 3. 📋 Vérifier les logs de déploiement
echo 4. 🧪 Tester l'API avec : test-ticket-api-after-deploy.bat
echo.
echo 📋 Routes ajoutées/corrigées :
echo    - /api/ticket-restaurant (GET, POST, DELETE)
echo    - /api/delays
echo    - /api/vacation-requests
echo.
echo 🧪 Test du bouton "Simuler scan" :
echo    - Le bouton génère un code-barres simulé
echo    - Extrait un montant aléatoire (5-15€)
echo    - Envoie les données à l'API
echo    - Affiche les statistiques en temps réel
echo.
echo ⚠️ IMPORTANT : Le backend doit être redémarré sur Render
echo    pour que les nouvelles routes soient disponibles.
echo.
echo 🎯 Appuyez sur une touche pour fermer...
pause



