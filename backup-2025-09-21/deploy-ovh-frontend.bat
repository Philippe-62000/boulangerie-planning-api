@echo off
echo 🚀 Déploiement du frontend sur OVH...
echo.

echo 📁 Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)

echo.
echo 📦 Compression des fichiers...
cd build
powershell -command "Compress-Archive -Path * -DestinationPath ..\..\frontend-build.zip -Force"

echo.
echo 🔄 Retour au répertoire principal...
cd ..\..

echo.
echo 📋 Fichiers à uploader sur OVH :
echo    - frontend-build.zip (contenu du dossier build/)
echo.
echo 📍 Emplacement sur OVH : /www/wwwroot/www.filmara.fr/
echo.
echo ⚠️  Instructions pour OVH :
echo    1. Connectez-vous à votre espace client OVH
echo    2. Allez dans "Hébergement" > "Gestion des fichiers"
echo    3. Naviguez vers /www/wwwroot/www.filmara.fr/
echo    4. Supprimez les anciens fichiers (index.html, static/, etc.)
echo    5. Uploadez et extrayez frontend-build.zip
echo    6. Vérifiez que les permissions sont correctes
echo.
echo ✅ Le fichier frontend-build.zip est prêt !
echo.
pause
