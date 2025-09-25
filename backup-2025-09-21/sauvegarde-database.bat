@echo off
echo ========================================
echo   SAUVEGARDE BASE DE DONNEES
echo ========================================
echo.

REM Obtenir la date actuelle
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%-%HH%h%Min%"

echo 📅 Date de sauvegarde: %timestamp%
echo.

echo ⚠️  IMPORTANT: 
echo    Cette sauvegarde nécessite l'accès à MongoDB
echo    et les credentials de connexion.
echo.

REM Vérifier si mongodump est installé
mongodump --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: mongodump n'est pas installé ou pas dans le PATH
    echo.
    echo 📥 Pour installer MongoDB Tools :
    echo    1. Téléchargez depuis: https://www.mongodb.com/try/download/database-tools
    echo    2. Ajoutez le dossier bin au PATH
    echo    3. Relancez ce script
    echo.
    pause
    exit /b 1
)

echo ✅ MongoDB Tools détecté
echo.

REM Demander les informations de connexion
echo 📝 Informations de connexion MongoDB :
echo.
set /p "mongo_uri=URI de connexion MongoDB (ex: mongodb://localhost:27017/boulangerie): "
set /p "backup_name=Nom du fichier de sauvegarde (ex: boulangerie-backup): "

if "%backup_name%"=="" set "backup_name=boulangerie-backup"

set "backup_file=%backup_name%-%timestamp%"

echo.
echo 🔄 Début de la sauvegarde...
echo.

REM Créer le dossier de sauvegarde
if not exist "database-backups" mkdir "database-backups"

REM Exécuter mongodump
mongodump --uri="%mongo_uri%" --out="database-backups\%backup_file%"

if errorlevel 1 (
    echo.
    echo ❌ ERREUR lors de la sauvegarde MongoDB
    echo.
    echo 🔍 Vérifications :
    echo    - URI de connexion correcte ?
    echo    - Serveur MongoDB accessible ?
    echo    - Permissions de lecture ?
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Sauvegarde MongoDB terminée !
echo.
echo 📁 Fichiers sauvegardés dans: database-backups\%backup_file%
echo.
echo 🔄 Pour restaurer la base de données :
echo   1. Utilisez: mongorestore database-backups\%backup_file%
echo   2. Ou le script: restaurer-database.bat
echo.
echo 📊 Collections sauvegardées :
echo    - employees (employés)
echo    - sickleaves (arrêts maladie)  
echo    - vacationrequests (demandes congés)
echo    - emailtemplates (templates email)
echo    - menupermissions (permissions)
echo    - parameters (paramètres)
echo    - Et toutes les autres collections...
echo.
pause




