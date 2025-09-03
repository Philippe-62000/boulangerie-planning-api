@echo off
echo ========================================
echo    TEST FRONTEND - PLANNING
echo ========================================
echo.

echo [1/3] Navigation vers le dossier frontend...
cd frontend

echo [2/3] Démarrage du serveur de développement...
echo.
echo 📱 Le navigateur devrait s'ouvrir automatiquement
echo 🌐 URL: http://localhost:3000
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arrêter le serveur
echo.

npm start

echo.
echo ========================================
echo    SERVEUR ARRÊTÉ
echo ========================================
pause

