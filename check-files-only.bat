@echo off
echo 🔍 Vérification des fichiers pour ticket-restaurant...
echo.

echo 📁 Vérification des fichiers backend...
if exist "backend\models\TicketRestaurant.js" (
    echo ✅ backend\models\TicketRestaurant.js
) else (
    echo ❌ backend\models\TicketRestaurant.js MANQUANT
)

if exist "backend\routes\ticketRestaurant.js" (
    echo ✅ backend\routes\ticketRestaurant.js
) else (
    echo ❌ backend\routes\ticketRestaurant.js MANQUANT
)

if exist "backend\server.js" (
    echo ✅ backend\server.js
) else (
    echo ❌ backend\server.js MANQUANT
)

echo.
echo 📁 Vérification des fichiers frontend...
if exist "frontend\src\pages\TicketRestaurant.js" (
    echo ✅ frontend\src\pages\TicketRestaurant.js
) else (
    echo ❌ frontend\src\pages\TicketRestaurant.js MANQUANT
)

if exist "frontend\src\pages\TicketRestaurant.css" (
    echo ✅ frontend\src\pages\TicketRestaurant.css
) else (
    echo ❌ frontend\src\pages\TicketRestaurant.css MANQUANT
)

echo.
echo 📁 Vérification de la route dans server.js...
findstr /C:"ticket-restaurant" backend\server.js >nul
if %errorlevel% neq 0 (
    echo ❌ Route ticket-restaurant MANQUANTE dans server.js
) else (
    echo ✅ Route ticket-restaurant trouvée dans server.js
)

echo.
echo 📁 Vérification de la route dans App.js...
findstr /C:"ticket-restaurant" frontend\src\App.js >nul
if %errorlevel% neq 0 (
    echo ❌ Route ticket-restaurant MANQUANTE dans App.js
) else (
    echo ✅ Route ticket-restaurant trouvée dans App.js
)

echo.
echo 📁 Vérification du menu dans Sidebar.js...
findstr /C:"ticket-restaurant" frontend\src\components\Sidebar.js >nul
if %errorlevel% neq 0 (
    echo ❌ Menu ticket-restaurant MANQUANT dans Sidebar.js
) else (
    echo ✅ Menu ticket-restaurant trouvé dans Sidebar.js
)

echo.
echo 📋 Résumé :
echo    - Si tous les fichiers sont présents : ✅ Système prêt
echo    - Si des fichiers manquent : ❌ Créer les fichiers manquants
echo.
echo 🎯 Prochaines étapes :
echo    1. Si fichiers manquants : Les créer
echo    2. Si fichiers présents : Redémarrer le backend sur Render
echo    3. Tester l'API avec : test-ticket-api-after-deploy.bat
echo.
pause



