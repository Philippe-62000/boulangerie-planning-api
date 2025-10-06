@echo off
echo ========================================
echo 🔧 CORRECTION PRIORITÉ PATTERNS
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
echo 🎫 Priorité des patterns corrigée :
echo   - 680 → 6,80€ (priorité sur 700)
echo   - 900 → 9€
echo   - 1152 → 11,52€
echo   - 700 → 7€
echo.
pause


