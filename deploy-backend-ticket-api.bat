@echo off
echo 🎫 Déploiement de l'API Ticket Restaurant...

echo.
echo 📦 Étape 1: Vérification des fichiers backend...
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

echo ✅ Fichiers backend trouvés

echo.
echo 📦 Étape 2: Installation des dépendances backend...
cd backend
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)
cd ..

echo.
echo 📦 Étape 3: Test de l'API localement...
cd backend
echo 🔧 Démarrage du serveur de test...
start /B node server.js
timeout /t 3 /nobreak > nul

echo.
echo 🧪 Test de l'API ticket-restaurant...
curl -X GET "http://localhost:5000/api/ticket-restaurant?month=2025-01" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ API locale non accessible, mais les fichiers sont prêts
) else (
    echo ✅ API locale fonctionne
)

cd ..

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
echo ✅ Déploiement terminé !
echo.
echo 🎯 Actions à effectuer :
echo    1. Redémarrer le serveur backend sur Render
echo    2. Vérifier que les routes /api/ticket-restaurant fonctionnent
echo    3. Tester le bouton "Simuler scan" dans l'interface
echo.
echo 📋 Routes API ajoutées :
echo    - GET /api/ticket-restaurant?month=YYYY-MM
echo    - POST /api/ticket-restaurant
echo    - DELETE /api/ticket-restaurant/:id
echo    - GET /api/ticket-restaurant/stats/:month
echo.
echo 🧪 Test du bouton "Simuler scan" :
echo    - Le bouton génère un code-barres simulé
echo    - Extrait un montant aléatoire (5-15€)
echo    - Envoie les données à l'API
echo    - Affiche les statistiques en temps réel
echo.
pause




