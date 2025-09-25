@echo off
echo ========================================
echo   CONFIGURATION NAS SFTP
echo ========================================
echo.
echo 🔧 Ce script configure l'accès SFTP au NAS
echo    pour les sauvegardes du projet.
echo.

echo 🔍 Configuration actuelle :
echo    Host: philange.synology.me
echo    Username: nHEIGHTn
echo    Port: 22
echo    Dossier: /sauvegarde
echo.

REM Vérifier si la variable est déjà définie
if not "%SFTP_PASSWORD%"=="" (
    echo ✅ Variable SFTP_PASSWORD déjà configurée
    echo    Longueur: %SFTP_PASSWORD:~0,3%***
    echo.
    set /p "reconfigure=Reconfigurer le mot de passe ? (oui/non): "
    if /i not "%reconfigure%"=="oui" (
        echo.
        echo ✅ Configuration conservée
        pause
        exit /b 0
    )
)

echo.
echo 🔐 Saisie du mot de passe SFTP :
echo    (Le mot de passe ne sera pas affiché à l'écran)
echo.

REM Demander le mot de passe (masqué)
set /p "sftp_password=Mot de passe SFTP: "

if "%sftp_password%"=="" (
    echo ❌ Mot de passe vide, annulation
    pause
    exit /b 1
)

echo.
echo 🧪 Test de connexion SFTP...

REM Créer un script Node.js temporaire pour tester la connexion
echo const SftpClient = require('ssh2-sftp-client'); > temp-test-sftp.js
echo. >> temp-test-sftp.js
echo async function testConnection() { >> temp-test-sftp.js
echo   const client = new SftpClient(); >> temp-test-sftp.js
echo   try { >> temp-test-sftp.js
echo     console.log('🔌 Test de connexion...'); >> temp-test-sftp.js
echo     await client.connect({ >> temp-test-sftp.js
echo       host: 'philange.synology.me', >> temp-test-sftp.js
echo       username: 'nHEIGHTn', >> temp-test-sftp.js
echo       password: process.argv[2], >> temp-test-sftp.js
echo       port: 22, >> temp-test-sftp.js
echo       readyTimeout: 10000 >> temp-test-sftp.js
echo     }); >> temp-test-sftp.js
echo     console.log('✅ Connexion réussie'); >> temp-test-sftp.js
echo. >> temp-test-sftp.js
echo     // Vérifier l'accès au dossier sauvegarde >> temp-test-sftp.js
echo     try { >> temp-test-sftp.js
echo       await client.list('/sauvegarde'); >> temp-test-sftp.js
echo       console.log('✅ Accès au dossier /sauvegarde confirmé'); >> temp-test-sftp.js
echo     } catch (err) { >> temp-test-sftp.js
echo       console.log('⚠️ Dossier /sauvegarde non accessible, création...'); >> temp-test-sftp.js
echo       try { >> temp-test-sftp.js
echo         await client.mkdir('/sauvegarde', true); >> temp-test-sftp.js
echo         console.log('✅ Dossier /sauvegarde créé'); >> temp-test-sftp.js
echo       } catch (mkdirErr) { >> temp-test-sftp.js
echo         console.log('❌ Impossible de créer /sauvegarde:', mkdirErr.message); >> temp-test-sftp.js
echo       } >> temp-test-sftp.js
echo     } >> temp-test-sftp.js
echo. >> temp-test-sftp.js
echo     await client.end(); >> temp-test-sftp.js
echo     console.log('✅ Test terminé avec succès'); >> temp-test-sftp.js
echo   } catch (error) { >> temp-test-sftp.js
echo     console.error('❌ Erreur de connexion:', error.message); >> temp-test-sftp.js
echo     process.exit(1); >> temp-test-sftp.js
echo   } >> temp-test-sftp.js
echo } >> temp-test-sftp.js
echo. >> temp-test-sftp.js
echo testConnection(); >> temp-test-sftp.js

REM Vérifier si ssh2-sftp-client est installé
node -e "require('ssh2-sftp-client')" >nul 2>&1
if errorlevel 1 (
    echo 📥 Installation du module ssh2-sftp-client...
    call npm install ssh2-sftp-client
    if errorlevel 1 (
        echo ❌ Erreur installation ssh2-sftp-client
        echo.
        echo 💡 Installez manuellement avec :
        echo    npm install ssh2-sftp-client
        echo.
        del temp-test-sftp.js >nul 2>&1
        pause
        exit /b 1
    )
    echo ✅ Module installé
)

REM Tester la connexion
node temp-test-sftp.js "%sftp_password%"

if errorlevel 1 (
    echo.
    echo ❌ ERREUR: Connexion SFTP échouée
    echo.
    echo 🔍 Vérifications :
    echo    - Mot de passe correct ?
    echo    - NAS allumé et accessible ?
    echo    - Connexion réseau stable ?
    echo    - Port 22 ouvert ?
    echo.
    del temp-test-sftp.js >nul 2>&1
    pause
    exit /b 1
)

del temp-test-sftp.js >nul 2>&1

echo.
echo ✅ Connexion SFTP validée !
echo.

REM Configurer la variable d'environnement
echo 🔧 Configuration de la variable d'environnement...
setx SFTP_PASSWORD "%sftp_password%"

if errorlevel 1 (
    echo ❌ Erreur lors de la configuration de la variable
    echo.
    echo 💡 Configuration manuelle :
    echo    1. Panneau de configuration
    echo    2. Système et sécurité
    echo    3. Système
    echo    4. Paramètres système avancés
    echo    5. Variables d'environnement
    echo    6. Nouvelle variable utilisateur :
    echo       Nom : SFTP_PASSWORD
    echo       Valeur : [votre_mot_de_passe]
    echo.
    pause
    exit /b 1
)

echo ✅ Variable SFTP_PASSWORD configurée
echo.

REM Créer un fichier .env pour le projet
echo 📝 Création du fichier .env pour le projet...
if not exist "backend\.env" (
    echo SFTP_PASSWORD=%sftp_password% >> backend\.env
    echo ✅ Ajouté à backend\.env
) else (
    findstr /C:"SFTP_PASSWORD" backend\.env >nul
    if errorlevel 1 (
        echo SFTP_PASSWORD=%sftp_password% >> backend\.env
        echo ✅ Ajouté à backend\.env
    ) else (
        echo ⚠️ SFTP_PASSWORD déjà présent dans backend\.env
        echo 💡 Vérifiez manuellement si la valeur est correcte
    )
)

echo.
echo 🎉 CONFIGURATION TERMINÉE !
echo.
echo 📋 Résumé :
echo    ✅ Connexion SFTP testée et validée
echo    ✅ Variable d'environnement configurée
echo    ✅ Fichier .env mis à jour
echo.
echo 🚀 Vous pouvez maintenant utiliser :
echo    - sauvegarde-nas.bat (sauvegarde sur NAS)
echo    - restaurer-depuis-nas.bat (restauration depuis NAS)
echo.
echo ⚠️  IMPORTANT : Redémarrez votre terminal pour que la
echo    variable d'environnement soit prise en compte.
echo.
pause



