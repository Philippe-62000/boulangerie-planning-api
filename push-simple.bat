@echo off
echo ========================================
echo   PUSH VERS GITHUB - FRONTEND
echo ========================================
echo.

echo [1/3] Ajout du remote GitHub...
git remote add origin https://github.com/Philippe-62000/boulangerie-planning-frontend.git
if %errorlevel% neq 0 (
    echo ⚠️  Remote déjà configuré
)

echo [2/3] Push vers GitHub...
git push -u origin master
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    echo.
    echo 🔧 Solutions possibles :
    echo 1. Créez le repository 'boulangerie-planning-frontend' sur GitHub
    echo 2. Vérifiez vos credentials Git
    echo 3. URL: https://github.com/Philippe-62000/boulangerie-planning-frontend
    pause
    exit /b 1
)

echo.
echo ✅ SUCCÈS ! Fichiers poussés vers GitHub
echo.
echo 📋 Prochaines étapes :
echo 1. Vérifiez le repository GitHub
echo 2. Uploadez les fichiers sur OVH
echo 3. Testez l'application
echo.
pause
