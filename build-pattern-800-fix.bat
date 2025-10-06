@echo off
echo ========================================
echo 🔧 AJOUT PATTERN 800 POUR 8€
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
echo 🔧 Pattern 800 ajouté :
echo   ✅ 680 → 6,80€
echo   ✅ 800 → 8€ (NOUVEAU)
echo   ✅ 900 → 9€
echo   ✅ 1152 → 11,52€
echo   ✅ 700 → 7€
echo   ✅ 383 → 3,83€
echo.
echo 🎯 Ordre d'affichage corrigé (createdAt)
echo.
pause

