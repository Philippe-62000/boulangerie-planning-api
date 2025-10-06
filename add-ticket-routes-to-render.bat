@echo off
echo 🎫 Ajout des routes ticket-restaurant au déploiement Render...

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
echo 📦 Étape 3: Vérification du package.json backend...
if not exist "backend\package.json" (
    echo ❌ package.json manquant
    pause
    exit /b 1
)

echo ✅ package.json présent

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
echo 🎯 ACTIONS À EFFECTUER SUR RENDER :
echo.
echo 1. 📁 Aller sur le dashboard Render
echo 2. 🔄 Redémarrer le service backend
echo 3. 📋 Vérifier les logs de déploiement
echo 4. 🧪 Tester l'API avec : test-ticket-api.bat
echo.
echo 📋 Nouvelles routes à ajouter :
echo    - /api/ticket-restaurant (GET, POST, DELETE)
echo    - /api/ticket-restaurant/stats/:month
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
pause



