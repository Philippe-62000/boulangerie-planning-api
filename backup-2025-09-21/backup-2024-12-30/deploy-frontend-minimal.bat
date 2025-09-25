@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND MINIMAL
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
echo 🔧 Préparation du déploiement minimal...
echo.

echo 📦 Création de l'archive frontend minimal...
if exist "frontend-ovh-minimal" rmdir /s /q "frontend-ovh-minimal"
mkdir "frontend-ovh-minimal"

echo 📁 Copie SEULEMENT des 2 fichiers modifiés...
echo.

echo 📄 Copie de Parameters.js...
xcopy "frontend\src\pages\Parameters.js" "frontend-ovh-minimal\src\pages\" /Y
echo    ✅ Parameters.js copié

echo 📄 Copie de Parameters-email-styles.css...
xcopy "frontend\src\pages\Parameters-email-styles.css" "frontend-ovh-minimal\src\pages\" /Y
echo    ✅ Parameters-email-styles.css copié

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-minimal\src\pages\Parameters.js" (
    echo    ✅ Parameters.js - Interface email templates
) else (
    echo    ❌ Erreur copie Parameters.js
    pause
    exit /b 1
)

if exist "frontend-ovh-minimal\src\pages\Parameters-email-styles.css" (
    echo    ✅ Parameters-email-styles.css - Styles email templates
) else (
    echo    ❌ Erreur copie Parameters-email-styles.css
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP minimal...
if exist "frontend-ovh-minimal.zip" del "frontend-ovh-minimal.zip"
powershell Compress-Archive -Path "frontend-ovh-minimal\*" -DestinationPath "frontend-ovh-minimal.zip"

if exist "frontend-ovh-minimal.zip" (
    echo    ✅ Archive créée: frontend-ovh-minimal.zip
    
    echo.
    echo 📊 Taille de l'archive minimal...
    for %%I in ("frontend-ovh-minimal.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-minimal"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND MINIMAL PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-minimal.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer SEULEMENT les 2 fichiers modifiés
echo 5. ✅ Tester l'interface sur https://www.filmara.fr
echo.
echo 🎯 Nouvelle fonctionnalité : Gestion des Messages Email
echo    - Section "📧 Gestion des Messages Email" dans Paramètres
echo    - Édition des templates d'email
echo    - Personnalisation du contenu des emails
echo.
echo 📊 Fichiers modifiés (seulement ces 2) :
echo    - frontend/src/pages/Parameters.js (interface email templates)
echo    - frontend/src/pages/Parameters-email-styles.css (styles)
echo.
echo 🚀 Archive minimal - Taille ultra-réduite !
echo.
pause
