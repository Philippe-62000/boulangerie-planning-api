@echo off
echo ========================================
echo   BUILD FRONTEND - CORRECTIONS CONGES
echo ========================================
echo.

echo 📁 Nettoyage du dossier build...
if exist "frontend\build" (
    rmdir /s /q "frontend\build"
    echo ✅ Dossier build supprimé
)

echo.
echo 🔨 Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)
cd ..

echo.
echo 📋 Vérification des fichiers construits...
if exist "frontend\build\index.html" (
    echo ✅ index.html créé
) else (
    echo ❌ index.html manquant
    pause
    exit /b 1
)

if exist "frontend\build\static" (
    echo ✅ Dossier static créé
) else (
    echo ❌ Dossier static manquant
    pause
    exit /b 1
)

echo.
echo 📁 Copie des fichiers standalone...
if exist "frontend\public\vacation-request-standalone.html" (
    copy "frontend\public\vacation-request-standalone.html" "frontend\build\vacation-request-standalone.html"
    echo ✅ vacation-request-standalone.html copié
) else (
    echo ❌ vacation-request-standalone.html manquant
)

if exist "frontend\public\sick-leave-standalone.html" (
    copy "frontend\public\sick-leave-standalone.html" "frontend\build\sick-leave-standalone.html"
    echo ✅ sick-leave-standalone.html copié
) else (
    echo ❌ sick-leave-standalone.html manquant
)

echo.
echo 📊 Statistiques du build...
for /f %%i in ('dir "frontend\build" /s /-c ^| find "Fichier(s)"') do echo %%i
for /f %%i in ('dir "frontend\build" /s /-c ^| find "répertoire(s)"') do echo %%i

echo.
echo ✅ Build terminé avec succès !
echo 📁 Dossier de build : frontend\build
echo.
echo 🚀 Prêt pour le déploiement OVH
echo.
pause
