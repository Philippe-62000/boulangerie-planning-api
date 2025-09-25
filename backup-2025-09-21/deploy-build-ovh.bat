@echo off
echo ========================================
echo 🚀 DEPLOIEMENT BUILD OVH
echo ========================================
echo.

echo 📋 Vérification du build...
echo.

if exist "frontend\build\index.html" (
    echo    ✅ Build trouvé - index.html présent
) else (
    echo    ❌ Build manquant - index.html absent
    echo    🔧 Veuillez d'abord exécuter rebuild-frontend-separate.bat
    pause
    exit /b 1
)

echo.
echo 🔧 Préparation du déploiement OVH...
echo.

echo 📦 Création de l'archive build pour OVH...
if exist "frontend-ovh-build" rmdir /s /q "frontend-ovh-build"
mkdir "frontend-ovh-build"

echo 📁 Copie du dossier build...
xcopy "frontend\build\*" "frontend-ovh-build\" /E /I /Y

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-build\index.html" (
    echo    ✅ index.html copié
) else (
    echo    ❌ Erreur copie index.html
    pause
    exit /b 1
)

if exist "frontend-ovh-build\static\css\main.bbc37fbb.css" (
    echo    ✅ CSS principal copié
) else (
    echo    ❌ Erreur copie CSS
    pause
    exit /b 1
)

if exist "frontend-ovh-build\static\js\main.dfe58b85.js" (
    echo    ✅ JavaScript principal copié
) else (
    echo    ❌ Erreur copie JavaScript
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-build.zip" del "frontend-ovh-build.zip"
powershell Compress-Archive -Path "frontend-ovh-build\*" -DestinationPath "frontend-ovh-build.zip"

if exist "frontend-ovh-build.zip" (
    echo    ✅ Archive créée: frontend-ovh-build.zip
    
    echo.
    echo 📊 Taille de l'archive...
    for %%I in ("frontend-ovh-build.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-build"

echo.
echo ========================================
echo ✅ DEPLOIEMENT BUILD OVH PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-build.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer TOUT le contenu existant
echo 5. ✅ Tester sur https://www.filmara.fr
echo.
echo 🎯 Nouvelle fonctionnalité : Gestion des Messages Email
echo    - Section "📧 Gestion des Messages Email" dans Paramètres
echo    - Édition des templates d'email
echo    - Personnalisation du contenu des emails
echo.
echo 📊 Contenu de l'archive :
echo    - index.html (page principale)
echo    - static/css/main.bbc37fbb.css (styles avec email templates)
echo    - static/js/main.dfe58b85.js (JavaScript avec interface email)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
