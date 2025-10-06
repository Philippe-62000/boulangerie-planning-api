@echo off
echo ========================================
echo 🔧 CORRECTION SCROLL + PATTERNS
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
echo 🔧 Corrections appliquées :
echo   ✅ Scroll position sauvegardée et restaurée
echo   ✅ Pattern 680 prioritaire sur 700
echo   ✅ Logs détaillés pour diagnostic
echo.
pause

