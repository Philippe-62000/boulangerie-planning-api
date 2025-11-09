@echo off
echo 🚀 Déploiement du backend sur Render...

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

echo ✅ Fichiers backend présents

echo.
echo 📦 Étape 2: Vérification de la route dans server.js...
findstr /C:"ticket-restaurant" backend\server.js >nul
if errorlevel 1 goto ADD_TICKET_ROUTE

echo ✅ Route trouvée dans server.js
goto AFTER_TICKET_ROUTE

:ADD_TICKET_ROUTE
echo ❌ Route manquante dans server.js
echo 🔧 Ajout de la route...
powershell -Command "Add-Content -Path 'backend/server.js' -Value ''"
powershell -Command "Add-Content -Path 'backend/server.js' -Value \"app.use('/api/ticket-restaurant', require('./routes/ticketRestaurant'));\""
echo ✅ Route ajoutée

:AFTER_TICKET_ROUTE

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
echo ✅ Déploiement prêt !
echo.
echo 🎯 ACTIONS À EFFECTUER SUR RENDER :
echo.
echo 1. 📁 Aller sur le dashboard Render
echo 2. 🔄 Redémarrer le service backend
echo 3. 📋 Vérifier les logs de déploiement
echo 4. 🧪 Vérifier rapidement l'API employés (création / modification)
echo.
echo 📋 Points à contrôler après redémarrage :
echo    - GET /api/employees (liste des salariés)
echo    - POST /api/employees (création avec connectionCode)
echo    - PUT /api/employees/:id (modification des codes)
echo.
echo 🧪 Astuce : utiliser Postman ou les scripts de tests internes pour valider les codes de connexion.
echo.
echo ⚠️ IMPORTANT : Le backend doit être redémarré sur Render
echo    pour que les nouvelles routes soient disponibles.
echo.
pause



