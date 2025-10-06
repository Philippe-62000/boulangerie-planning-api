@echo off
echo ========================================
echo 🔧 LOGIQUE HYBRIDE PATTERNS + OFFICIELLE
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
echo 🔧 Logique hybride implémentée :
echo   ✅ Patterns connus (priorité) : 680, 1152, 900, 700, 383
echo   ✅ Structure officielle (fallback) : positions 12-16
echo   ✅ Scroll position sauvegardée et restaurée
echo   ✅ Logs détaillés pour diagnostic
echo.
pause

