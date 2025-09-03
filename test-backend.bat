@echo off
echo ========================================
echo    TEST BACKEND - API
echo ========================================
echo.

echo [1/3] Navigation vers le dossier backend...
cd backend

echo [2/3] Démarrage du serveur backend...
echo.
echo 🌐 URL: http://localhost:10000
echo 📡 API: http://localhost:10000/api
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arrêter le serveur
echo.

node server.js

echo.
echo ========================================
echo    SERVEUR ARRÊTÉ
echo ========================================
pause

