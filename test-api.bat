@echo off
echo Test de l'API locale...

echo.
echo 1. Installation des dependances...
cd deploy\api
call npm install

echo.
echo 2. Demarrage du serveur API...
echo L'API sera accessible sur http://localhost:5000
echo Appuyez sur Ctrl+C pour arreter
echo.
node server.js
