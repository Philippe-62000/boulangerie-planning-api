@echo off
echo ========================================
echo RESTAURATION DE LA VERSION QUI FONCTIONNAIT
echo ========================================

echo.
echo 1. Nettoyage complet du dossier deploy...
if exist "deploy" rmdir /s /q "deploy"
mkdir "deploy"
mkdir "deploy\www"
mkdir "deploy\api"

echo.
echo 2. Copie du frontend (www)...
xcopy "frontend\build\*" "deploy\www\" /E /I /Y

echo.
echo 3. Copie du backend avec la config qui fonctionne...
xcopy "backend\*" "deploy\api\" /E /I /Y

echo.
echo 4. Suppression de node_modules (sera reinstalle sur le serveur)...
if exist "deploy\api\node_modules" rmdir /s /q "deploy\api\node_modules"

echo.
echo 5. Verification de la configuration...
echo La configuration utilise la base de donnees MongoDB Atlas existante
echo Tous vos employes et donnees seront preserves

echo.
echo ========================================
echo RESTAURATION TERMINEE !
echo ========================================
echo.
echo Vous pouvez maintenant lancer upload-to-ovh.bat
echo.
pause



