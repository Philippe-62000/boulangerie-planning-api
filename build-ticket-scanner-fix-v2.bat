@echo off
echo ========================================
echo 🔧 CORRECTION EXTRACTION MONTANT TICKET
echo ========================================
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo.
echo 🏗️ Construction du frontend...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo.
echo ✅ Construction terminée avec succès
echo.
echo 📦 Fichiers construits dans: frontend\build\
echo.
echo 🚀 Prêt pour le déploiement OVH
echo.
pause


