@echo off
echo Mise a jour du repository GitHub
echo ================================

:: Verifier si Git est installe
git --version >nul 2>&1
if errorlevel 1 (
    echo Git n'est pas installe. Installez Git d'abord.
    pause
    exit /b 1
)

:: Aller dans le dossier de l'API
cd deploy\api

:: Ajouter tous les fichiers
echo Ajout des fichiers...
git add .

:: Faire un commit
echo Commit des changements...
git commit -m "Mise a jour API avec route /health et logs ameliores"

:: Pousser vers GitHub
echo Push vers GitHub...
git push origin main

echo.
echo Mise a jour terminee !
echo Maintenant redepoyez sur Render.
pause
