@echo off
echo ========================================
echo 🔧 CORRECTION RECONNAISSANCE PATTERNS
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
echo 🎫 Reconnaissance de patterns :
echo   - 900 → 9€
echo   - 680 → 6,80€
echo   - 1152 → 11,52€
echo   - 700 → 7€
echo   - 383 → 3,83€
echo.
pause


