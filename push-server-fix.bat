@echo off
echo ========================================
echo Correction du serveur pour Render
echo ========================================

echo.
echo 1. Ajout des fichiers corriges...
git add server.js package.json render.yaml

echo.
echo 2. Commit de la correction...
git commit -m "🔧 Fix serveur Render - server.js a la racine + package.json"

echo.
echo 3. Push sur master...
git push origin master

echo.
echo 4. Push sur main...
git push origin main

echo.
echo ========================================
echo Correction serveur poussee !
echo ========================================
pause
