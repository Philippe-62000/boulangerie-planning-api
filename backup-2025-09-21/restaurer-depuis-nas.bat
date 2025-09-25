@echo off
echo ========================================
echo   RESTAURATION DEPUIS NAS
echo ========================================
echo.

set "nas_path=\\nas\sauvegarde"

echo 🖥️ Chemin NAS: %nas_path%
echo.

echo 📁 Liste des sauvegardes disponibles sur le NAS...
echo.

REM Créer un script Node.js temporaire pour lister les sauvegardes
echo const SftpClient = require('ssh2-sftp-client'); > temp-list.js
echo. >> temp-list.js
echo async function listBackups() { >> temp-list.js
echo   const client = new SftpClient(); >> temp-list.js
echo   try { >> temp-list.js
echo     console.log('🔌 Connexion au NAS...'); >> temp-list.js
echo     await client.connect({ >> temp-list.js
echo       host: 'philange.synology.me', >> temp-list.js
echo       username: 'nHEIGHTn', >> temp-list.js
echo       password: process.env.SFTP_PASSWORD, >> temp-list.js
echo       port: 22, >> temp-list.js
echo       readyTimeout: 20000 >> temp-list.js
echo     }); >> temp-list.js
echo     console.log('✅ Connecté au NAS'); >> temp-list.js
echo. >> temp-list.js
echo     const backups = await client.list('/sauvegarde'); >> temp-list.js
echo     const backupDirs = backups.filter(item => item.type === 'd' && item.name.startsWith('backup-')); >> temp-list.js
echo     if (backupDirs.length === 0) { >> temp-list.js
echo       console.log('❌ Aucune sauvegarde trouvée'); >> temp-list.js
echo       process.exit(1); >> temp-list.js
echo     } >> temp-list.js
echo     console.log('📁 Sauvegardes disponibles :'); >> temp-list.js
echo     backupDirs.forEach(backup => console.log('  -', backup.name)); >> temp-list.js
echo     await client.end(); >> temp-list.js
echo   } catch (error) { >> temp-list.js
echo     console.error('❌ Erreur SFTP:', error.message); >> temp-list.js
echo     process.exit(1); >> temp-list.js
echo   } >> temp-list.js
echo } >> temp-list.js
echo. >> temp-list.js
echo listBackups(); >> temp-list.js

REM Vérifier si ssh2-sftp-client est installé
node -e "require('ssh2-sftp-client')" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Module ssh2-sftp-client non trouvé
    echo 📥 Installation du module...
    call npm install ssh2-sftp-client
    if errorlevel 1 (
        echo ❌ Erreur installation ssh2-sftp-client
        echo.
        pause
        del temp-list.js >nul 2>&1
        exit /b 1
    )
)

REM Vérifier la variable d'environnement SFTP_PASSWORD
if "%SFTP_PASSWORD%"=="" (
    echo ❌ ERREUR: Variable SFTP_PASSWORD non définie
    echo.
    echo 🔧 Pour configurer :
    echo    set SFTP_PASSWORD=votre_mot_de_passe
    echo.
    pause
    del temp-list.js >nul 2>&1
    exit /b 1
)

REM Lister les sauvegardes
node temp-list.js
if errorlevel 1 (
    echo ❌ Erreur lors de la liste des sauvegardes
    del temp-list.js >nul 2>&1
    pause
    exit /b 1
)

del temp-list.js >nul 2>&1

echo.
set /p "backup_name=Nom de la sauvegarde à restaurer (ex: backup-2024-12-30): "

echo.
echo ⚠️  ATTENTION: Cette opération va restaurer le projet
echo    depuis la sauvegarde NAS : %backup_name%
echo.

set /p "confirm=Voulez-vous vraiment restaurer ? (oui/non): "
if /i not "%confirm%"=="oui" (
    echo.
    echo ❌ Restauration annulée
    pause
    exit /b 0
)

echo.
echo 🔄 Début de la restauration depuis le NAS...
echo.

REM Sauvegarder les fichiers modifiés récents
echo 📦 Sauvegarde des modifications récentes...
if not exist "backup-recent" mkdir backup-recent
robocopy . backup-recent /E /XD backup-recent node_modules .git /XF *.log /MAXAGE:1

REM Nettoyer le répertoire actuel (sauf les sauvegardes)
echo 🧹 Nettoyage du répertoire actuel...
for /d %%d in (*) do (
    if /i not "%%d"=="backup-recent" (
        echo Suppression de %%d
        rmdir /s /q "%%d" 2>nul
    )
)
for %%f in (*.*) do (
    if /i not "%%f"=="restaurer-depuis-nas.bat" (
        echo Suppression de %%f
        del /q "%%f" 2>nul
    )
)

REM Télécharger depuis le NAS via SFTP
echo 📥 Téléchargement depuis le NAS...

REM Créer un script Node.js temporaire pour le téléchargement SFTP
echo const SftpClient = require('ssh2-sftp-client'); > temp-download.js
echo const fs = require('fs'); >> temp-download.js
echo. >> temp-download.js
echo async function downloadFromNAS() { >> temp-download.js
echo   const client = new SftpClient(); >> temp-download.js
echo   try { >> temp-download.js
echo     console.log('🔌 Connexion au NAS...'); >> temp-download.js
echo     await client.connect({ >> temp-download.js
echo       host: 'philange.synology.me', >> temp-download.js
echo       username: 'nHEIGHTn', >> temp-download.js
echo       password: process.env.SFTP_PASSWORD, >> temp-download.js
echo       port: 22, >> temp-download.js
echo       readyTimeout: 20000 >> temp-download.js
echo     }); >> temp-download.js
echo     console.log('✅ Connecté au NAS'); >> temp-download.js
echo. >> temp-download.js
echo     const remotePath = '/sauvegarde/%backup_name%'; >> temp-download.js
echo     console.log('📥 Téléchargement de:', remotePath); >> temp-download.js
echo     await client.downloadDir(remotePath, './%backup_name%'); >> temp-download.js
echo     console.log('✅ Téléchargement terminé'); >> temp-download.js
echo. >> temp-download.js
echo     await client.end(); >> temp-download.js
echo   } catch (error) { >> temp-download.js
echo     console.error('❌ Erreur SFTP:', error.message); >> temp-download.js
echo     process.exit(1); >> temp-download.js
echo   } >> temp-download.js
echo } >> temp-download.js
echo. >> temp-download.js
echo downloadFromNAS(); >> temp-download.js

REM Exécuter le script de téléchargement
node temp-download.js

if errorlevel 1 (
    echo ❌ ERREUR lors du téléchargement SFTP
    echo.
    echo 🔍 Vérifications :
    echo    - Sauvegarde %backup_name% existe sur le NAS ?
    echo    - Connexion réseau stable ?
    echo    - Espace disque suffisant ?
    echo.
    pause
    del temp-download.js >nul 2>&1
    exit /b 1
)

del temp-download.js >nul 2>&1

echo 📥 Restauration des fichiers...
if exist "%backup_name%" (
    robocopy "%backup_name%" . /E /R:3 /W:1
    if errorlevel 8 (
        echo ❌ ERREUR lors de la copie des fichiers
        echo.
        pause
        exit /b 1
    )
    rmdir /s /q "%backup_name%"
) else (
    echo ❌ ERREUR: Dossier de sauvegarde non trouvé après téléchargement
    pause
    exit /b 1
)

echo.
echo ✅ Restauration depuis le NAS terminée !
echo.
echo 📋 ÉTAPES SUIVANTES :
echo.
echo 1. 🔧 Installer les dépendances :
echo    cd backend ^&^& npm install
echo    cd ../frontend ^&^& npm install
echo.
echo 2. ⚙️ Vérifier les variables d'environnement :
echo    backend\.env
echo.
echo 3. 🗄️ Configurer la base de données MongoDB
echo.
echo 4. 🚀 Tester l'application :
echo    cd backend ^&^& npm start
echo    cd frontend ^&^& npm start
echo.
echo 5. ✅ Vérifier : http://localhost:3001/api/health
echo.
echo 🚨 ATTENTION : 
echo - Les modifications récentes sont dans backup-recent\
echo - Vérifiez les fichiers de configuration
echo - Redéployez sur Render si nécessaire
echo.
echo 🔗 URLs de votre projet déployé :
echo    Backend : https://boulangerie-planning-api-4-pbfy.onrender.com
echo    Frontend: https://www.filmara.fr/plan/
echo.
pause
