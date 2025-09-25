@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND - ONGLETS FINAL
echo ========================================
echo.

echo 📋 Vérification du nouveau build avec onglets...
echo.

if exist "frontend\build\index.html" (
    echo    ✅ Build trouvé - index.html présent
) else (
    echo    ❌ Build manquant - index.html absent
    echo    🔧 Veuillez d'abord exécuter le build
    pause
    exit /b 1
)

echo.
echo 🔧 Préparation du déploiement OVH...
echo.

echo 📦 Création de l'archive build avec onglets...
if exist "frontend-ovh-onglets" rmdir /s /q "frontend-ovh-onglets"
mkdir "frontend-ovh-onglets"

echo 📁 Copie du nouveau dossier build...
xcopy "frontend\build\*" "frontend-ovh-onglets\" /E /I /Y

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-onglets\index.html" (
    echo    ✅ index.html copié
) else (
    echo    ❌ Erreur copie index.html
    pause
    exit /b 1
)

if exist "frontend-ovh-onglets\static\css\main.3942f0ed.css" (
    echo    ✅ Nouveau CSS principal copié (avec onglets + alertes email)
) else (
    echo    ❌ Erreur copie CSS
    pause
    exit /b 1
)

if exist "frontend-ovh-onglets\static\js\main.a94d3d26.js" (
    echo    ✅ Nouveau JavaScript principal copié (avec interface onglets)
) else (
    echo    ❌ Erreur copie JavaScript
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-onglets.zip" del "frontend-ovh-onglets.zip"
powershell Compress-Archive -Path "frontend-ovh-onglets\*" -DestinationPath "frontend-ovh-onglets.zip"

if exist "frontend-ovh-onglets.zip" (
    echo    ✅ Archive créée: frontend-ovh-onglets.zip
    
    echo.
    echo 📊 Taille de l'archive...
    for %%I in ("frontend-ovh-onglets.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-onglets"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND ONGLETS PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-onglets.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer TOUT le contenu existant
echo 5. ✅ Tester sur https://www.filmara.fr
echo.
echo 🎯 Nouvelles fonctionnalités avec onglets :
echo    - 🏪 Onglet: Informations du Site
echo    - 🔐 Onglet: Gestion des Mots de Passe
echo    - 🔐 Onglet: Gestion des Permissions de Menu
echo    - 🚗 Onglet: Paramètres - Frais KM
echo    - 📋 Onglet: Templates disponibles (alertes + comptable)
echo    - 🗄️ Onglet: Gestion de la Base de Données
echo    - 🚨 Configuration des alertes email
echo    - 📧 Email du magasin et administrateur
echo    - 🎯 Choix des destinataires (magasin/admin/les deux)
echo    - 📝 Template d'alerte personnalisable
echo    - ✏️ Édition des templates d'email
echo.
echo 📊 Contenu de l'archive (NOUVEAU BUILD) :
echo    - index.html (page principale)
echo    - static/css/main.3942f0ed.css (styles AVEC onglets + alertes email)
echo    - static/js/main.a94d3d26.js (JavaScript AVEC interface onglets)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
