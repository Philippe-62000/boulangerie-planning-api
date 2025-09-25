@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND - FIX FINAL
echo ========================================
echo.

echo 📋 Vérification du nouveau build avec corrections...
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

echo 📦 Création de l'archive build avec corrections...
if exist "frontend-ovh-fix" rmdir /s /q "frontend-ovh-fix"
mkdir "frontend-ovh-fix"

echo 📁 Copie du nouveau dossier build...
xcopy "frontend\build\*" "frontend-ovh-fix\" /E /I /Y

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-fix\index.html" (
    echo    ✅ index.html copié
) else (
    echo    ❌ Erreur copie index.html
    pause
    exit /b 1
)

if exist "frontend-ovh-fix\static\css\main.23e7ee41.css" (
    echo    ✅ Nouveau CSS principal copié (avec corrections)
) else (
    echo    ❌ Erreur copie CSS
    pause
    exit /b 1
)

if exist "frontend-ovh-fix\static\js\main.dfdc09e8.js" (
    echo    ✅ Nouveau JavaScript principal copié (avec corrections)
) else (
    echo    ❌ Erreur copie JavaScript
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-fix.zip" del "frontend-ovh-fix.zip"
powershell Compress-Archive -Path "frontend-ovh-fix\*" -DestinationPath "frontend-ovh-fix.zip"

if exist "frontend-ovh-fix.zip" (
    echo    ✅ Archive créée: frontend-ovh-fix.zip
    
    echo.
    echo 📊 Taille de l'archive...
    for %%I in ("frontend-ovh-fix.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-fix"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND FIX PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-fix.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer TOUT le contenu existant
echo 5. ✅ Tester sur https://www.filmara.fr
echo.
echo 🎯 Corrections apportées :
echo    - ✅ Fix handleParameterChange pour gérer les ID
echo    - ✅ Création automatique des paramètres manquants
echo    - ✅ Alert warning si paramètres manquants
echo    - ✅ Gestion des erreurs améliorée
echo    - ✅ Support des valeurs boolean
echo    - ✅ Interface utilisateur améliorée
echo.
echo 📊 Contenu de l'archive (NOUVEAU BUILD) :
echo    - index.html (page principale)
echo    - static/css/main.23e7ee41.css (styles AVEC corrections)
echo    - static/js/main.dfdc09e8.js (JavaScript AVEC corrections)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
