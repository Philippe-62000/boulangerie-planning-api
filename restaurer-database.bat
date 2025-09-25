@echo off
echo ========================================
echo   RESTAURATION BASE DE DONNEES
echo ========================================
echo.

echo ⚠️  ATTENTION: Cette opération va ÉCRASER la base de données actuelle !
echo.

REM Lister les sauvegardes disponibles
if not exist "database-backups" (
    echo ❌ ERREUR: Aucun dossier database-backups trouvé
    echo.
    echo 📥 Créez d'abord une sauvegarde avec: sauvegarde-database.bat
    echo.
    pause
    exit /b 1
)

echo 📁 Sauvegardes disponibles :
echo.
dir /b database-backups\boulangerie-backup-* 2>nul
echo.

if errorlevel 1 (
    echo ❌ Aucune sauvegarde trouvée
    echo.
    echo 📥 Créez d'abord une sauvegarde avec: sauvegarde-database.bat
    echo.
    pause
    exit /b 1
)

REM Demander la sauvegarde à restaurer
set /p "backup_name=Nom de la sauvegarde à restaurer (ex: boulangerie-backup-2024-12-30-14h30): "

if not exist "database-backups\%backup_name%" (
    echo ❌ ERREUR: La sauvegarde %backup_name% n'existe pas !
    echo.
    echo 📁 Sauvegardes disponibles :
    dir /b database-backups\boulangerie-backup-*
    echo.
    pause
    exit /b 1
)

REM Demander les informations de connexion
echo.
echo 📝 Informations de connexion MongoDB :
echo.
set /p "mongo_uri=URI de connexion MongoDB (ex: mongodb://localhost:27017/boulangerie): "

echo.
echo 🔄 Début de la restauration...
echo.

REM Exécuter mongorestore
mongorestore --uri="%mongo_uri%" --drop "database-backups\%backup_name%"

if errorlevel 1 (
    echo.
    echo ❌ ERREUR lors de la restauration MongoDB
    echo.
    echo 🔍 Vérifications :
    echo    - URI de connexion correcte ?
    echo    - Serveur MongoDB accessible ?
    echo    - Permissions d'écriture ?
    echo    - Fichiers de sauvegarde intacts ?
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Restauration MongoDB terminée !
echo.
echo 📊 Collections restaurées :
echo    - employees (employés)
echo    - sickleaves (arrêts maladie)
echo    - vacationrequests (demandes congés)
echo    - emailtemplates (templates email)
echo    - menupermissions (permissions)
echo    - parameters (paramètres)
echo    - Et toutes les autres collections...
echo.
echo 🔄 Prochaines étapes :
echo    1. Vérifiez les données dans l'interface
echo    2. Testez les fonctionnalités principales
echo    3. Redémarrez l'application si nécessaire
echo.
pause





