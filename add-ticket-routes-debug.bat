@echo off
echo 🎫 Ajout des routes ticket-restaurant au déploiement Render...
echo.
echo 🔍 Vérification du répertoire de travail...
echo 📁 Répertoire actuel: %CD%
echo.

echo 📦 Étape 1: Vérification des fichiers...
echo 🔍 Vérification de backend\models\TicketRestaurant.js...
if not exist "backend\models\TicketRestaurant.js" (
    echo ❌ Fichier TicketRestaurant.js manquant
    echo 📁 Vérifiez que le fichier existe dans backend\models\
    echo.
    echo ⏸️ Appuyez sur une touche pour continuer...
    pause
    exit /b 1
) else (
    echo ✅ Fichier TicketRestaurant.js trouvé
)

if not exist "backend\routes\ticketRestaurant.js" (
    echo ❌ Fichier ticketRestaurant.js manquant
    echo 📁 Vérifiez que le fichier existe dans backend\routes\
    pause
    exit /b 1
) else (
    echo ✅ Fichier ticketRestaurant.js trouvé
)

echo.
echo 📦 Étape 2: Vérification de la route dans server.js...
if not exist "backend\server.js" (
    echo ❌ Fichier server.js manquant
    echo 📁 Vérifiez que le fichier existe dans backend\
    pause
    exit /b 1
) else (
    echo ✅ Fichier server.js trouvé
)

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
    echo 📁 Vérifiez que le fichier existe dans backend\
    pause
    exit /b 1
) else (
    echo ✅ package.json trouvé
)

echo.
echo 📦 Étape 4: Construction du frontend...
if not exist "frontend\package.json" (
    echo ❌ package.json frontend manquant
    echo 📁 Vérifiez que le fichier existe dans frontend\
    pause
    exit /b 1
) else (
    echo ✅ package.json frontend trouvé
)

cd frontend
echo 🔧 Construction du frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    echo 📋 Vérifiez que npm est installé et que les dépendances sont à jour
    pause
    exit /b 1
) else (
    echo ✅ Frontend construit avec succès
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
echo 4. 🧪 Tester l'API avec : test-ticket-api-after-deploy.bat
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
echo 📋 Prochaines étapes :
echo    1. Redémarrer le backend sur Render
echo    2. Tester l'API avec : test-ticket-api-after-deploy.bat
echo    3. Tester le bouton "Simuler scan" dans l'interface
echo.
echo 🎯 Script terminé ! Appuyez sur une touche pour fermer...
pause
