@echo off
echo ========================================
echo 🔧 REBUILD FRONTEND LOCAL
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
echo 🔧 Rebuild du frontend...
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 📦 Installation des dépendances...
npm install

echo 🔨 Build de production...
npm run build

echo.
echo 📋 Vérification du build...
if exist "build\index.html" (
    echo    ✅ Build réussi - index.html créé
) else (
    echo    ❌ Erreur build - index.html manquant
    cd ..
    pause
    exit /b 1
)

echo.
echo 📊 Taille du dossier build...
for /f "tokens=3" %%a in ('dir build /s /-c ^| find "File(s)"') do echo    📦 Taille totale: %%a octets

echo.
echo 📁 Retour au dossier racine...
cd ..

echo.
echo ========================================
echo ✅ REBUILD TERMINÉ !
echo ========================================
echo.
echo 📋 Instructions de déploiement OVH :
echo.
echo 1. 📤 Copier TOUT le dossier "frontend\build\" sur OVH
echo 2. 🌐 Remplacer le contenu existant de votre site
echo 3. ✅ Tester sur https://www.filmara.fr
echo.
echo 🎯 Nouvelle fonctionnalité : Gestion des Messages Email
echo    - Section "📧 Gestion des Messages Email" dans Paramètres
echo    - Édition des templates d'email
echo    - Personnalisation du contenu des emails
echo.
echo 🚀 Prêt pour le déploiement !
echo.
pause
