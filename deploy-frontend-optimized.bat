@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND OPTIMISÉ
echo ========================================
echo.

echo 📋 Vérification des fichiers modifiés...
echo.

echo ✅ Parameters.js - Interface email templates
if exist "frontend\src\pages\Parameters.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ Parameters-email-styles.css - Styles email templates
if exist "frontend\src\pages\Parameters-email-styles.css" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Préparation du déploiement optimisé...
echo.

echo 📦 Création de l'archive frontend optimisée...
if exist "frontend-ovh-optimized" rmdir /s /q "frontend-ovh-optimized"
mkdir "frontend-ovh-optimized"

echo 📁 Copie des fichiers essentiels uniquement...
echo.

echo 📄 Copie des fichiers HTML...
if exist "frontend\public\index.html" (
    xcopy "frontend\public\index.html" "frontend-ovh-optimized\public\" /Y
    echo    ✅ index.html copié
)

echo 📄 Copie des fichiers CSS...
if exist "frontend\src\pages\Parameters.css" (
    xcopy "frontend\src\pages\Parameters.css" "frontend-ovh-optimized\src\pages\" /Y
    echo    ✅ Parameters.css copié
)

if exist "frontend\src\pages\Parameters-email-styles.css" (
    xcopy "frontend\src\pages\Parameters-email-styles.css" "frontend-ovh-optimized\src\pages\" /Y
    echo    ✅ Parameters-email-styles.css copié
)

echo 📄 Copie des fichiers JavaScript modifiés...
if exist "frontend\src\pages\Parameters.js" (
    xcopy "frontend\src\pages\Parameters.js" "frontend-ovh-optimized\src\pages\" /Y
    echo    ✅ Parameters.js copié
)

echo 📄 Copie des fichiers de configuration...
if exist "frontend\package.json" (
    xcopy "frontend\package.json" "frontend-ovh-optimized\" /Y
    echo    ✅ package.json copié
)

if exist "frontend\package-lock.json" (
    xcopy "frontend\package-lock.json" "frontend-ovh-optimized\" /Y
    echo    ✅ package-lock.json copié
)

echo 📄 Copie des fichiers de build...
if exist "frontend\build" (
    xcopy "frontend\build\*" "frontend-ovh-optimized\build\" /E /I /Y
    echo    ✅ Dossier build copié
)

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-optimized\src\pages\Parameters.js" (
    echo    ✅ Parameters.js - Interface email templates
) else (
    echo    ❌ Erreur copie Parameters.js
    pause
    exit /b 1
)

if exist "frontend-ovh-optimized\src\pages\Parameters-email-styles.css" (
    echo    ✅ Parameters-email-styles.css - Styles email templates
) else (
    echo    ❌ Erreur copie Parameters-email-styles.css
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP optimisée...
if exist "frontend-ovh-optimized.zip" del "frontend-ovh-optimized.zip"
powershell Compress-Archive -Path "frontend-ovh-optimized\*" -DestinationPath "frontend-ovh-optimized.zip"

if exist "frontend-ovh-optimized.zip" (
    echo    ✅ Archive créée: frontend-ovh-optimized.zip
    
    echo.
    echo 📊 Taille de l'archive optimisée...
    for %%I in ("frontend-ovh-optimized.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-optimized"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND OPTIMISÉ PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-optimized.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer SEULEMENT les fichiers modifiés
echo 5. ✅ Tester l'interface sur https://www.filmara.fr
echo.
echo 🎯 Nouvelle fonctionnalité : Gestion des Messages Email
echo    - Section "📧 Gestion des Messages Email" dans Paramètres
echo    - Édition des templates d'email
echo    - Personnalisation du contenu des emails
echo.
echo 📊 Fichiers modifiés (seulement ceux-ci) :
echo    - frontend/src/pages/Parameters.js (interface email templates)
echo    - frontend/src/pages/Parameters-email-styles.css (styles)
echo.
echo 🚀 Archive optimisée - Taille réduite !
echo.
pause
