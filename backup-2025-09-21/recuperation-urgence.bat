@echo off
echo ========================================
echo   RÉCUPÉRATION D'URGENCE BOULANGERIE
echo ========================================
echo.
echo 🚨 Ce script vous aide à récupérer le projet
echo    après vol/panne d'ordinateur
echo.

REM Vérifier si Git est installé
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git n'est pas installé !
    echo.
    echo 📥 Veuillez installer Git d'abord :
    echo    https://git-scm.com/download/win
    echo.
    echo 🔄 Puis relancez ce script
    echo.
    pause
    exit /b 1
)

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé !
    echo.
    echo 📥 Veuillez installer Node.js d'abord :
    echo    https://nodejs.org/en/download/
    echo.
    echo 🔄 Puis relancez ce script
    echo.
    pause
    exit /b 1
)

echo ✅ Git et Node.js détectés
echo.

echo 📥 Récupération du projet depuis GitHub...
echo.

REM Cloner le repository
git clone https://github.com/Philippe-62000/boulangerie-planning-api.git boulangerie-planning-recupere

if errorlevel 1 (
    echo ❌ Erreur lors du clonage !
    echo.
    echo 🔍 Vérifications :
    echo    - Connexion internet active ?
    echo    - URL GitHub correcte ?
    echo    - Permissions d'accès ?
    echo.
    pause
    exit /b 1
)

echo ✅ Projet récupéré !
echo.

cd boulangerie-planning-recupere

echo 🔧 Installation des dépendances backend...
cd backend
call npm install

if errorlevel 1 (
    echo ❌ Erreur installation backend !
    echo.
    echo 🔄 Essayez manuellement :
    echo    cd backend
    echo    npm install
    echo.
    pause
    exit /b 1
)

echo ✅ Backend configuré !
echo.

echo 🎨 Installation des dépendances frontend...
cd ..\frontend
call npm install

if errorlevel 1 (
    echo ❌ Erreur installation frontend !
    echo.
    echo 🔄 Essayez manuellement :
    echo    cd frontend
    echo    npm install
    echo.
    pause
    exit /b 1
)

echo ✅ Frontend configuré !
echo.

REM Créer un fichier .env minimal
echo ⚙️ Configuration de base...
cd ..\backend

echo MONGODB_URI=mongodb://localhost:27017/boulangerie > .env
echo JWT_SECRET=secret-temporaire-a-changer-rapidement >> .env
echo EMAILJS_PUBLIC_KEY=votre-cle-publique >> .env
echo EMAILJS_PRIVATE_KEY=votre-cle-privee >> .env
echo EMAILJS_SERVICE_ID=votre-service-id >> .env
echo EMAILJS_TEMPLATE_ID=votre-template-id >> .env

echo.
echo 🎉 RÉCUPÉRATION TERMINÉE !
echo.
echo 📁 Projet récupéré dans : boulangerie-planning-recupere\
echo.
echo 📋 PROCHAINES ÉTAPES :
echo.
echo 1. ⚙️  Modifier backend\.env avec vos vraies configurations
echo 2. 🗄️  Configurer votre base de données MongoDB
echo 3. 🚀  Lancer le backend : cd backend ^&^& npm start
echo 4. 🎨  Lancer le frontend : cd frontend ^&^& npm start
echo 5. ✅  Tester : http://localhost:3001/api/health
echo.
echo 🔗 URLs de votre projet déployé :
echo    Backend : https://boulangerie-planning-api-4-pbfy.onrender.com
echo    Frontend: https://www.filmara.fr/plan/
echo.
echo 📚 Guides disponibles :
echo    - GUIDE-RECUPERATION-URGENCE.md
echo    - RECUPERATION-URGENCE-GITHUB.md
echo    - RECUPERATION-URGENCE-RENDER.md
echo    - RECUPERATION-URGENCE-CLOUD.md
echo.
echo 🎯 Configuration complète :
echo    1. Variables d'environnement (.env)
echo    2. Base de données MongoDB
echo    3. Clés EmailJS
echo    4. Test de toutes les fonctionnalités
echo.
pause


