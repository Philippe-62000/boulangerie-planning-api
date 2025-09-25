@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND - ALERTES EMAIL
echo ========================================
echo.

echo 📋 Vérification du nouveau build...
echo.

if exist "frontend\build\index.html" (
    echo    ✅ Build trouvé - index.html présent
) else (
    echo    ❌ Build manquant - index.html absent
    echo    🔧 Veuillez d'abord exécuter build-and-replace-frontend.bat
    pause
    exit /b 1
)

echo.
echo 🔧 Préparation du déploiement OVH...
echo.

echo 📦 Création de l'archive build avec alertes...
if exist "frontend-ovh-alertes" rmdir /s /q "frontend-ovh-alertes"
mkdir "frontend-ovh-alertes"

echo 📁 Copie du nouveau dossier build...
xcopy "frontend\build\*" "frontend-ovh-alertes\" /E /I /Y

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-alertes\index.html" (
    echo    ✅ index.html copié
) else (
    echo    ❌ Erreur copie index.html
    pause
    exit /b 1
)

if exist "frontend-ovh-alertes\static\css\main.0d13a37e.css" (
    echo    ✅ Nouveau CSS principal copié (avec alertes email)
) else (
    echo    ❌ Erreur copie CSS
    pause
    exit /b 1
)

if exist "frontend-ovh-alertes\static\js\main.786f1553.js" (
    echo    ✅ Nouveau JavaScript principal copié (avec interface alertes)
) else (
    echo    ❌ Erreur copie JavaScript
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-alertes.zip" del "frontend-ovh-alertes.zip"
powershell Compress-Archive -Path "frontend-ovh-alertes\*" -DestinationPath "frontend-ovh-alertes.zip"

if exist "frontend-ovh-alertes.zip" (
    echo    ✅ Archive créée: frontend-ovh-alertes.zip
    
    echo.
    echo 📊 Taille de l'archive...
    for %%I in ("frontend-ovh-alertes.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-alertes"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND ALERTES PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-alertes.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer TOUT le contenu existant
echo 5. ✅ Tester sur https://www.filmara.fr
echo.
echo 🎯 Nouvelles fonctionnalités :
echo    - 🚨 Configuration des alertes email
echo    - 📧 Email du magasin et administrateur
echo    - 🎯 Choix des destinataires (magasin/admin/les deux)
echo    - 📝 Template d'alerte personnalisable
echo    - ✏️ Édition des templates d'email
echo.
echo 📊 Contenu de l'archive (NOUVEAU BUILD) :
echo    - index.html (page principale)
echo    - static/css/main.0d13a37e.css (styles AVEC alertes email)
echo    - static/js/main.786f1553.js (JavaScript AVEC interface alertes)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
