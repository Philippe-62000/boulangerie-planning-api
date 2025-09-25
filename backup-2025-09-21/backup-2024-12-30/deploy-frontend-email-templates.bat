@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND - EMAIL TEMPLATES
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
echo 🔧 Préparation du déploiement...
echo.

echo 📦 Création de l'archive frontend...
if exist "frontend-ovh-email-templates" rmdir /s /q "frontend-ovh-email-templates"
mkdir "frontend-ovh-email-templates"

echo 📁 Copie des fichiers frontend...
xcopy "frontend\*" "frontend-ovh-email-templates\" /E /I /Y

echo 📋 Vérification des fichiers copiés...
if exist "frontend-ovh-email-templates\src\pages\Parameters.js" (
    echo    ✅ Parameters.js copié
) else (
    echo    ❌ Erreur copie Parameters.js
    pause
    exit /b 1
)

if exist "frontend-ovh-email-templates\src\pages\Parameters-email-styles.css" (
    echo    ✅ Parameters-email-styles.css copié
) else (
    echo    ❌ Erreur copie Parameters-email-styles.css
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-email-templates.zip" del "frontend-ovh-email-templates.zip"
powershell Compress-Archive -Path "frontend-ovh-email-templates\*" -DestinationPath "frontend-ovh-email-templates.zip"

if exist "frontend-ovh-email-templates.zip" (
    echo    ✅ Archive créée: frontend-ovh-email-templates.zip
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-email-templates"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-email-templates.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer les fichiers existants
echo 5. ✅ Tester l'interface sur https://www.filmara.fr
echo.
echo 🎯 Nouvelle fonctionnalité : Gestion des Messages Email
echo    - Section "📧 Gestion des Messages Email" dans Paramètres
echo    - Édition des templates d'email
echo    - Personnalisation du contenu des emails
echo.
echo 📊 Fichiers modifiés :
echo    - frontend/src/pages/Parameters.js (interface email templates)
echo    - frontend/src/pages/Parameters-email-styles.css (styles)
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
