@echo off
echo 🚀 Déploiement automatique vers GitHub
echo ======================================

:: Vérifier si Git est installé
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git n'est pas installé. Installez Git d'abord.
    pause
    exit /b 1
)

:: Créer le dossier temporaire pour l'API
echo 📁 Création du dossier temporaire...
if exist boulangerie-api-temp (
    rmdir /s /q boulangerie-api-temp
)
mkdir boulangerie-api-temp
cd boulangerie-api-temp

:: Copier tous les fichiers de l'API
echo 📋 Copie des fichiers...
xcopy "..\deploy\api\*" "." /E /I /Y

:: Initialiser Git
echo 🔧 Initialisation Git...
git init
git add .
git commit -m "Initial commit - API Boulangerie Planning"

:: Demander l'URL du repository GitHub
echo.
echo 🌐 Entrez l'URL de votre repository GitHub:
echo    (ex: https://github.com/votre-username/boulangerie-api.git)
set /p GITHUB_URL="URL: "

:: Ajouter le remote et pousser
echo 📤 Push vers GitHub...
git branch -M main
git remote add origin %GITHUB_URL%
git push -u origin main

:: Nettoyer
echo 🧹 Nettoyage...
cd ..
rmdir /s /q boulangerie-api-temp

echo.
echo ✅ Déploiement terminé !
echo 📋 Prochaines étapes:
echo    1. Allez sur https://render.com
echo    2. Connectez votre compte GitHub
echo    3. Sélectionnez le repository boulangerie-api
echo    4. Configurez les variables d'environnement
echo.
pause
