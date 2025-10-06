@echo off
echo ========================================
echo 🔧 CORRECTION MULTI-FORMAT CODES-BARRES
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
echo 🎫 Support multi-format des codes-barres :
echo   - 24 chars: positions 12-15
echo   - 20 chars: positions 8-11  
echo   - 15+ chars: positions 6-9
echo.
pause


