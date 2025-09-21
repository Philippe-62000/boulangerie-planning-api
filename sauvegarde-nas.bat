@echo off
echo ========================================
echo    SAUVEGARDE PROJET VERS NAS
echo ========================================
echo.

REM Obtenir la date actuelle
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%-%HH%h%Min%"

set "backup_folder=backup-%YYYY%-%MM%-%DD%"
set "nas_path=\\nas\sauvegarde"

echo 📅 Date de sauvegarde: %timestamp%
echo 📁 Dossier de sauvegarde: %backup_folder%
echo 🖥️ Destination NAS: %nas_path%
echo.

REM Créer le dossier de sauvegarde local
if not exist "%backup_folder%" mkdir "%backup_folder%"

echo 🔄 Création de la sauvegarde locale...
echo.

REM Sauvegarder tous les fichiers sauf node_modules et .git
robocopy . "%backup_folder%" /E /XD node_modules .git %backup_folder% /XF *.log /R:3 /W:1

if errorlevel 8 (
    echo ❌ ERREUR lors de la sauvegarde locale
    echo.
    pause
    exit /b 1
)

echo ✅ Sauvegarde locale créée !
echo.

echo 📤 Upload vers le NAS via SFTP...
echo.

REM Créer un script Node.js temporaire pour l'upload SFTP
echo const SftpClient = require('ssh2-sftp-client'); > temp-upload.js
echo const path = require('path'); >> temp-upload.js
echo const fs = require('fs'); >> temp-upload.js
echo. >> temp-upload.js
echo async function uploadToNAS() { >> temp-upload.js
echo   const client = new SftpClient(); >> temp-upload.js
echo   try { >> temp-upload.js
echo     console.log('🔌 Connexion au NAS...'); >> temp-upload.js
echo     await client.connect({ >> temp-upload.js
echo       host: 'philange.synology.me', >> temp-upload.js
echo       username: 'nHEIGHTn', >> temp-upload.js
echo       password: process.env.SFTP_PASSWORD, >> temp-upload.js
echo       port: 22, >> temp-upload.js
echo       readyTimeout: 20000 >> temp-upload.js
echo     }); >> temp-upload.js
echo     console.log('✅ Connecté au NAS'); >> temp-upload.js
echo. >> temp-upload.js
echo     const remotePath = '/sauvegarde/%backup_folder%'; >> temp-upload.js
echo     console.log('📁 Création du dossier:', remotePath); >> temp-upload.js
echo     try { >> temp-upload.js
echo       await client.mkdir(remotePath, true); >> temp-upload.js
echo     } catch (err) { >> temp-upload.js
echo       console.log('📁 Dossier existe déjà ou créé'); >> temp-upload.js
echo     } >> temp-upload.js
echo. >> temp-upload.js
echo     console.log('📤 Upload des fichiers...'); >> temp-upload.js
echo     await client.uploadDir('./%backup_folder%', remotePath); >> temp-upload.js
echo     console.log('✅ Upload terminé'); >> temp-upload.js
echo. >> temp-upload.js
echo     await client.end(); >> temp-upload.js
echo     console.log('✅ Sauvegarde NAS terminée !'); >> temp-upload.js
echo   } catch (error) { >> temp-upload.js
echo     console.error('❌ Erreur SFTP:', error.message); >> temp-upload.js
echo     process.exit(1); >> temp-upload.js
echo   } >> temp-upload.js
echo } >> temp-upload.js
echo. >> temp-upload.js
echo uploadToNAS(); >> temp-upload.js

REM Vérifier si ssh2-sftp-client est installé
node -e "require('ssh2-sftp-client')" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Module ssh2-sftp-client non trouvé
    echo 📥 Installation du module...
    call npm install ssh2-sftp-client
    if errorlevel 1 (
        echo ❌ Erreur installation ssh2-sftp-client
        echo.
        echo 💡 Veuillez installer manuellement :
        echo    npm install ssh2-sftp-client
        echo.
        pause
        exit /b 1
    )
)

REM Vérifier la variable d'environnement SFTP_PASSWORD
if "%SFTP_PASSWORD%"=="" (
    echo ❌ ERREUR: Variable SFTP_PASSWORD non définie
    echo.
    echo 🔧 Pour configurer :
    echo    set SFTP_PASSWORD=votre_mot_de_passe
    echo    Ou ajoutez-la dans votre fichier .env
    echo.
    pause
    exit /b 1
)

REM Exécuter le script d'upload
node temp-upload.js

if errorlevel 1 (
    echo ❌ ERREUR lors de l'upload SFTP
    echo.
    echo 🔍 Vérifications :
    echo    - NAS allumé et accessible ?
    echo    - Mot de passe SFTP correct ?
    echo    - Connexion réseau stable ?
    echo    - Permissions d'écriture sur /sauvegarde ?
    echo.
    echo 💡 La sauvegarde locale est disponible dans : %backup_folder%
    echo.
    pause
    del temp-upload.js >nul 2>&1
    exit /b 1
)

REM Nettoyer le script temporaire
del temp-upload.js >nul 2>&1

echo ✅ Sauvegarde NAS terminée !
echo.

REM Nettoyer la sauvegarde locale (optionnel)
set /p "cleanup=Supprimer la sauvegarde locale ? (oui/non): "
if /i "%cleanup%"=="oui" (
    echo 🧹 Nettoyage de la sauvegarde locale...
    rmdir /s /q "%backup_folder%"
    echo ✅ Nettoyage terminé
)

echo.
echo 📋 INFORMATIONS DE SAUVEGARDE :
echo.
echo - 📁 Sauvegardé dans : %nas_path%\%backup_folder%
echo - 📅 Date : %timestamp%
echo - 🗂️ Contenu : Code source, configs, scripts, docs
echo - ❌ Exclusions : node_modules, .git, *.log
echo.
echo 🔄 Pour restaurer :
echo   1. Copier depuis le NAS vers un nouveau PC
echo   2. Utiliser : restaurer-depuis-nas.bat
echo   3. Ou suivre : GUIDE-RECUPERATION-URGENCE.md
echo.
echo 📝 Note: Cette sauvegarde contient :
echo   ✅ Code source complet
echo   ✅ Configuration backend/frontend  
echo   ✅ Scripts de déploiement
echo   ✅ Documentation
echo   ❌ Dépendances (npm install requis)
echo   ❌ Base de données (séparée)
echo.
pause
