@echo off
echo 🏖️ Build du frontend avec gestion des congés...
echo.

REM Vérifier que nous sommes dans le bon répertoire
if not exist "frontend" (
    echo ❌ Erreur: Le répertoire 'frontend' n'existe pas
    echo Veuillez exécuter ce script depuis la racine du projet
    pause
    exit /b 1
)

REM Aller dans le répertoire frontend
cd frontend

echo 🔧 Installation des dépendances...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo 🏗️ Build de l'application React...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)

echo.
echo ✅ Build terminé avec succès !
echo 📁 Les fichiers sont dans le répertoire 'build'
echo.

REM Créer une archive des fichiers modifiés
echo 📦 Création de l'archive des fichiers de congés...
cd build

REM Créer un répertoire temporaire pour les fichiers de congés
mkdir temp_conges 2>nul

REM Copier les fichiers spécifiques aux congés
echo 📋 Copie des fichiers de gestion des congés...

REM Page standalone de demande de congés
if exist "vacation-request-standalone.html" (
    copy "vacation-request-standalone.html" "temp_conges\" >nul
    echo ✅ vacation-request-standalone.html
) else (
    echo ⚠️ vacation-request-standalone.html non trouvé
)

REM Fichiers JS des pages de congés
if exist "static\js\*.js" (
    for %%f in (static\js\*.js) do (
        copy "%%f" "temp_conges\" >nul
    )
    echo ✅ Fichiers JS des pages de congés
)

REM Fichiers CSS des pages de congés
if exist "static\css\*.css" (
    for %%f in (static\css\*.css) do (
        copy "%%f" "temp_conges\" >nul
    )
    echo ✅ Fichiers CSS des pages de congés
)

REM Créer l'archive
echo.
echo 🗜️ Création de l'archive...
powershell -command "Compress-Archive -Path 'temp_conges\*' -DestinationPath 'conges-files.zip' -Force"
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la création de l'archive
    pause
    exit /b 1
)

REM Nettoyer le répertoire temporaire
rmdir /s /q temp_conges

echo.
echo ✅ Archive créée: conges-files.zip
echo 📊 Taille de l'archive:
for %%A in (conges-files.zip) do echo    %%~zA octets

echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo 📋 Instructions de déploiement:
echo    1. Extraire conges-files.zip sur le serveur
echo    2. Remplacer les fichiers existants
echo    3. Tester les nouvelles fonctionnalités
echo.
echo 🏖️ Nouvelles fonctionnalités ajoutées:
echo    ✅ Page standalone de demande de congés
echo    ✅ Gestion des congés (validation/rejet)
echo    ✅ Planning annuel des congés
echo    ✅ Récapitulatif des congés au tableau de bord
echo    ✅ Templates email pour les congés
echo    ✅ Menu navigation mis à jour
echo.

pause
