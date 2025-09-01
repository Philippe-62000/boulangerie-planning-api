@echo off
echo ========================================
echo Correction de la configuration Render
echo ========================================

echo.
echo 1. Ajout du fichier render.yaml...
git add render.yaml

echo.
echo 2. Commit de la correction...
git commit -m "🔧 Fix configuration Render - Correction des commandes PowerShell"

echo.
echo 3. Push sur master...
git push origin master

echo.
echo 4. Push sur main...
git push origin main

echo.
echo ========================================
echo Correction Render poussee !
echo ========================================
pause
