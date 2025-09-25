@echo off
echo ========================================
echo 🔧 BUILD FRONTEND - FIX PARAMÈTRES
echo ========================================
echo.

echo 📋 Vérification des fichiers modifiés...
echo.

echo ✅ Parameters.js - Fix handleParameterChange
if exist "frontend\src\pages\Parameters.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ Parameters-email-styles.css - Styles alert
if exist "frontend\src\pages\Parameters-email-styles.css" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Build du frontend avec corrections...
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 🧹 Nettoyage du build précédent...
if exist "build" (
    rmdir /s /q build
    echo    ✅ Ancien build supprimé
) else (
    echo    ℹ️ Aucun build précédent trouvé
)

echo 📦 Installation des dépendances...
npm install

echo 🔨 Build de production...
npm run build

echo.
echo 📋 Vérification du nouveau build...
if exist "build\index.html" (
    echo    ✅ Build réussi - index.html créé
) else (
    echo    ❌ Erreur build - index.html manquant
    cd ..
    pause
    exit /b 1
)

echo.
echo 📊 Taille du nouveau dossier build...
for /f "tokens=3" %%a in ('dir build /s /-c ^| find "File(s)"') do echo    📦 Taille totale: %%a octets

echo.
echo 📁 Retour au dossier racine...
cd ..

echo.
echo ========================================
echo ✅ BUILD FRONTEND FIX TERMINÉ !
echo ========================================
echo.
echo 📋 Fichiers générés dans frontend/build/ :
echo    - index.html (page principale)
echo    - static/css/main.xxx.css (styles avec corrections)
echo    - static/js/main.xxx.js (JavaScript avec corrections)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo 💡 Instructions de déploiement OVH :
echo    1. Copier TOUT le dossier "frontend\build\" sur OVH
echo    2. Remplacer le contenu existant de votre site
echo    3. Tester sur https://www.filmara.fr
echo.
echo 🎯 Corrections apportées :
echo    - ✅ Fix handleParameterChange pour gérer les ID
echo    - ✅ Création automatique des paramètres manquants
echo    - ✅ Alert warning si paramètres manquants
echo    - ✅ Gestion des erreurs améliorée
echo.
pause
