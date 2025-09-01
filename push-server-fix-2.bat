@echo off
echo ========================================
echo Correction du serveur Render (v2)
echo ========================================

echo.
echo 1. Ajout du serveur corrige...
git add server.js

echo.
echo 2. Commit de la correction...
git commit -m "🔧 Fix serveur Render v2 - Correction du chemin require"

echo.
echo 3. Push sur master...
git push origin master

echo.
echo 4. Push sur main...
git push origin main

echo.
echo ========================================
echo Correction serveur v2 poussee !
echo ========================================
pause
