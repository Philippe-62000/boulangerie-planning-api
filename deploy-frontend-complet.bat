@echo off
echo 🚀 Déploiement Frontend Complet - Configuration Email Comptable
echo.

echo 📦 Compilation du projet React...
cd frontend
call npm run build
cd ..

echo.
echo 📋 Vérification du dossier build...
if exist "frontend\build\index.html" (
    echo ✅ Build réussi - index.html trouvé
) else (
    echo ❌ Erreur - index.html non trouvé
    pause
    exit /b 1
)

echo.
echo 📤 Copie des fichiers vers OVH...
echo 📂 Source: frontend\build\*
echo 📂 Destination: C:\Users\%USERNAME%\Desktop\boulangerie-planning\plan\
echo.

xcopy "frontend\build\*" "C:\Users\%USERNAME%\Desktop\boulangerie-planning\plan\" /E /H /C /I /Y

if %ERRORLEVEL% EQU 0 (
    echo ✅ Copie réussie !
) else (
    echo ❌ Erreur lors de la copie
    pause
    exit /b 1
)

echo.
echo ✅ Déploiement terminé avec succès !
echo.
echo 📋 Nouvelles fonctionnalités déployées :
echo    - Configuration Email Comptable dans Paramètres
echo    - Bouton de sauvegarde pour l'email du comptable
echo    - Interface améliorée pour la gestion des arrêts maladie
echo    - Corrections des erreurs ESLint
echo.
echo 🌐 Testez maintenant :
echo    - Page Paramètres → Configuration Email Comptable
echo    - Gestion des arrêts maladie
echo.
echo 📂 Fichiers déployés depuis : frontend\build\
echo 📂 Vers le dossier : C:\Users\%USERNAME%\Desktop\boulangerie-planning\plan\
echo.
pause



