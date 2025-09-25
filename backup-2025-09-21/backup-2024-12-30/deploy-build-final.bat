@echo off
echo ========================================
echo 🚀 DEPLOIEMENT BUILD FINAL - EMAIL TEMPLATES
echo ========================================
echo.

echo 📋 Vérification du nouveau build...
echo.

if exist "frontend\build\index.html" (
    echo    ✅ Build trouvé - index.html présent
) else (
    echo    ❌ Build manquant - index.html absent
    echo    🔧 Veuillez d'abord exécuter le rebuild
    pause
    exit /b 1
)

echo.
echo 🔧 Préparation du déploiement OVH...
echo.

echo 📦 Création de l'archive build final...
if exist "frontend-ovh-final" rmdir /s /q "frontend-ovh-final"
mkdir "frontend-ovh-final"

echo 📁 Copie du nouveau dossier build...
xcopy "frontend\build\*" "frontend-ovh-final\" /E /I /Y

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-final\index.html" (
    echo    ✅ index.html copié
) else (
    echo    ❌ Erreur copie index.html
    pause
    exit /b 1
)

if exist "frontend-ovh-final\static\css\main.ee654bb7.css" (
    echo    ✅ Nouveau CSS principal copié (avec email templates)
) else (
    echo    ❌ Erreur copie CSS
    pause
    exit /b 1
)

if exist "frontend-ovh-final\static\js\main.eba51fa4.js" (
    echo    ✅ Nouveau JavaScript principal copié (avec interface email)
) else (
    echo    ❌ Erreur copie JavaScript
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-final.zip" del "frontend-ovh-final.zip"
powershell Compress-Archive -Path "frontend-ovh-final\*" -DestinationPath "frontend-ovh-final.zip"

if exist "frontend-ovh-final.zip" (
    echo    ✅ Archive créée: frontend-ovh-final.zip
    
    echo.
    echo 📊 Taille de l'archive...
    for %%I in ("frontend-ovh-final.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-final"

echo.
echo ========================================
echo ✅ DEPLOIEMENT BUILD FINAL PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-final.zip
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
echo 📊 Contenu de l'archive (NOUVEAU BUILD) :
echo    - index.html (page principale)
echo    - static/css/main.ee654bb7.css (styles AVEC email templates)
echo    - static/js/main.eba51fa4.js (JavaScript AVEC interface email)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
