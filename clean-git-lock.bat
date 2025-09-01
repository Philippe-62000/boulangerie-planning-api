@echo off
echo ========================================
echo Nettoyage du verrouillage Git
echo ========================================

echo.
echo 1. Suppression du fichier de verrouillage...
if exist ".git\index.lock" (
    del ".git\index.lock"
    echo Fichier de verrouillage supprime
) else (
    echo Aucun fichier de verrouillage trouve
)

echo.
echo 2. Ajout du fichier render.yaml...
git add render.yaml

echo.
echo 3. Commit de la correction...
git commit -m "🔧 Fix configuration Render - Correction des commandes PowerShell"

echo.
echo 4. Push sur master...
git push origin master

echo.
echo 5. Push sur main...
git push origin main

echo.
echo ========================================
echo Correction Render poussee !
echo ========================================
pause
