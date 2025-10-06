@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT #021 - SYSTÈME DE RETARDS
echo ========================================
echo.

echo 📦 Construction du frontend...
cd frontend
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo.
echo ✅ Construction terminée
echo.

echo 📤 Upload vers OVH...
robocopy "C:\boulangerie-planning\frontend\build" "\\ftp.filmara.fr\www\plan" /E /R:3 /W:10
cd ..

if %ERRORLEVEL% leq 7 (
    echo.
    echo ✅ DÉPLOIEMENT #021 TERMINÉ AVEC SUCCÈS !
    echo.
    echo 🎯 NOUVELLES FONCTIONNALITÉS :
    echo   • Onglet "🕐 Déclarer retard" dans la page absences
    echo   • Modal de déclaration avec sélection employé, date et durée
    echo   • Champ delays ajouté au schéma Employee
    echo   • API /api/delays pour gestion des retards
    echo   • Intégration dans les statistiques d'absences
    echo.
    echo 🌐 Site : https://www.filmara.fr/plan/absences
    echo.
) else (
    echo ❌ Erreur lors de l'upload
    pause
    exit /b 1
)

echo.
echo 🎉 Déploiement terminé !
pause
