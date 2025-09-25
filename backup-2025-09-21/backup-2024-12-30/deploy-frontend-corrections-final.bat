@echo off
echo ========================================
echo 🚀 DEPLOIEMENT FRONTEND - CORRECTIONS FINAL
echo ========================================
echo.

echo 📋 Vérification du nouveau build avec toutes les corrections...
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

echo 📦 Création de l'archive build avec corrections complètes...
if exist "frontend-ovh-corrections" rmdir /s /q "frontend-ovh-corrections"
mkdir "frontend-ovh-corrections"

echo 📁 Copie du nouveau dossier build...
xcopy "frontend\build\*" "frontend-ovh-corrections\" /E /I /Y

echo.
echo 📋 Vérification des fichiers copiés...
echo.

if exist "frontend-ovh-corrections\index.html" (
    echo    ✅ index.html copié
) else (
    echo    ❌ Erreur copie index.html
    pause
    exit /b 1
)

if exist "frontend-ovh-corrections\static\css\main.23e7ee41.css" (
    echo    ✅ Nouveau CSS principal copié (avec corrections)
) else (
    echo    ❌ Erreur copie CSS
    pause
    exit /b 1
)

if exist "frontend-ovh-corrections\static\js\main.77e22538.js" (
    echo    ✅ Nouveau JavaScript principal copié (avec corrections)
) else (
    echo    ❌ Erreur copie JavaScript
    pause
    exit /b 1
)

echo.
echo 📦 Création de l'archive ZIP...
if exist "frontend-ovh-corrections.zip" del "frontend-ovh-corrections.zip"
powershell Compress-Archive -Path "frontend-ovh-corrections\*" -DestinationPath "frontend-ovh-corrections.zip"

if exist "frontend-ovh-corrections.zip" (
    echo    ✅ Archive créée: frontend-ovh-corrections.zip
    
    echo.
    echo 📊 Taille de l'archive...
    for %%I in ("frontend-ovh-corrections.zip") do echo    📦 Taille: %%~zI octets (%%~zI / 1024 / 1024 MB)
) else (
    echo    ❌ Erreur création archive
    pause
    exit /b 1
)

echo.
echo 🧹 Nettoyage des fichiers temporaires...
rmdir /s /q "frontend-ovh-corrections"

echo.
echo ========================================
echo ✅ DEPLOIEMENT FRONTEND CORRECTIONS PRÊT !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Télécharger l'archive : frontend-ovh-corrections.zip
echo 2. 🌐 Aller sur votre espace OVH
echo 3. 📁 Décompresser l'archive dans le répertoire web
echo 4. 🔄 Remplacer TOUT le contenu existant
echo 5. ✅ Tester sur https://www.filmara.fr
echo.
echo 🎯 Corrections apportées :
echo    - ✅ Masquage arrêts maladie après 8 jours (Tableau de bord)
echo    - ✅ Masquage arrêts maladie après 8 jours (Gestion des salariés)
echo    - ✅ Fix page "État des absences" avec gestion d'erreur
echo    - ✅ Synchronisation automatique validation → déclaration manuelle
echo    - ✅ Amélioration de la logique de calcul des statistiques
echo    - ✅ Gestion d'erreur robuste dans AbsenceStatus
echo.
echo 📊 Contenu de l'archive (NOUVEAU BUILD) :
echo    - index.html (page principale)
echo    - static/css/main.23e7ee41.css (styles AVEC corrections)
echo    - static/js/main.77e22538.js (JavaScript AVEC corrections)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
