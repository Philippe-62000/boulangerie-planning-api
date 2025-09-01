@echo off
echo Preparation du deploiement...

echo.
echo 1. Nettoyage du dossier deploy/api...
if exist "deploy\api" rmdir /s /q "deploy\api"
mkdir "deploy\api"

echo.
echo 2. Copie des fichiers du backend...
xcopy "backend\*" "deploy\api\" /E /I /Y

echo.
echo 3. Copie de la configuration de developpement (qui fonctionne)...
echo (Preserve la base de donnees existante)
copy "backend\config.js" "deploy\api\config.js" /Y

echo.
echo 4. Suppression de node_modules (sera reinstalle sur le serveur)...
if exist "deploy\api\node_modules" rmdir /s /q "deploy\api\node_modules"

echo.
echo Preparation terminee !
echo Vous pouvez maintenant lancer upload-to-ovh.bat
pause
