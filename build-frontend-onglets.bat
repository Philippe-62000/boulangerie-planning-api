@echo off
echo ========================================
echo 🔧 BUILD FRONTEND - SYSTÈME D'ONGLETS
echo ========================================
echo.

echo 📋 Vérification des fichiers modifiés...
echo.

echo ✅ Parameters.js - Système d'onglets
if exist "frontend\src\pages\Parameters.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ Parameters-tabs-styles.css - Styles onglets
if exist "frontend\src\pages\Parameters-tabs-styles.css" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ Parameters-email-styles.css - Styles alertes email
if exist "frontend\src\pages\Parameters-email-styles.css" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Build du  qui se frontend avec onglets...
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
echo ✅ BUILD AVEC ONGLETS TERMINÉ !
echo ========================================
echo.
echo 📋 Fichiers générés dans frontend/build/ :
echo    - index.html (page principale)
echo    - static/css/main.xxx.css (styles avec onglets + alertes email)
echo    - static/js/main.xxx.js (JavaScript avec interface onglets)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo 💡 Instructions de déploiement OVH :
echo    1. Copier TOUT le dossier "frontend\build\" sur OVH
echo    2. Remplacer le contenu existant de votre site
echo    3. Tester sur https://www.filmara.fr
echo.
echo 🎯 Nouvelles fonctionnalités :
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
echo.
pause
