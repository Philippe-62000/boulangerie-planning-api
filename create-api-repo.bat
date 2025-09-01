@echo off
echo Creation d'un nouveau repository pour l'API
echo ===========================================

:: Verifier si Git est installe
git --version >nul 2>&1
if errorlevel 1 (
    echo Git n'est pas installe. Installez Git d'abord.
    pause
    exit /b 1
)

:: Creer un nouveau dossier pour l'API
echo Creation du dossier temporaire...
if exist boulangerie-api-temp (
    rmdir /s /q boulangerie-api-temp
)
mkdir boulangerie-api-temp
cd boulangerie-api-temp

:: Copier tous les fichiers de l'API
echo Copie des fichiers...
xcopy "..\deploy\api\*" "." /E /I /Y

:: Initialiser Git
echo Initialisation Git...
git init
git add .
git commit -m "Initial commit - API Boulangerie Planning avec route /health"

:: Demander l'URL du repository GitHub
echo.
echo Entrez l'URL de votre repository GitHub pour l'API:
echo    (ex: https://github.com/votre-username/boulangerie-api.git)
set /p GITHUB_URL="URL: "

:: Ajouter le remote et pousser
echo Push vers GitHub...
git branch -M main
git remote add origin %GITHUB_URL%
git push -u origin main

:: Nettoyer
echo Nettoyage...
cd ..
rmdir /s /q boulangerie-api-temp

echo.
echo Repository cree avec succes !
echo Maintenant redepoyez sur Render.
pause
