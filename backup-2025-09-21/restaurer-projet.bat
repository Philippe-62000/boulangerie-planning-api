@echo off
echo ========================================
echo    RESTAURATION PROJET BOULANGERIE
echo ========================================
echo.
echo Ce script restaure le projet depuis la sauvegarde du 30/12/2024
echo.

REM Vérifier que la sauvegarde existe
if not exist "backup-2024-12-30" (
    echo ❌ ERREUR: La sauvegarde backup-2024-12-30 n'existe pas !
    echo.
    echo Veuillez vous assurer que le dossier de sauvegarde est présent.
    pause
    exit /b 1
)

echo ✅ Sauvegarde trouvée
echo.

REM Demander confirmation
set /p confirm="Voulez-vous vraiment restaurer le projet ? (oui/non): "
if /i not "%confirm%"=="oui" (
    echo.
    echo ❌ Restauration annulée
    pause
    exit /b 0
)

echo.
echo 🔄 Début de la restauration...
echo.

REM Sauvegarder les fichiers modifiés récents
echo 📦 Sauvegarde des modifications récentes...
if not exist "backup-recent" mkdir backup-recent
robocopy . backup-recent /E /XD backup-2024-12-30 backup-recent node_modules .git /XF *.log /MAXAGE:1

REM Nettoyer le répertoire actuel (sauf les sauvegardes)
echo 🧹 Nettoyage du répertoire actuel...
for /d %%d in (*) do (
    if /i not "%%d"=="backup-2024-12-30" if /i not "%%d"=="backup-recent" (
        echo Suppression de %%d
        rmdir /s /q "%%d"
    )
)
for %%f in (*.*) do (
    if /i not "%%f"=="restaurer-projet.bat" (
        echo Suppression de %%f
        del /q "%%f"
    )
)

REM Restaurer depuis la sauvegarde
echo 📥 Restauration depuis la sauvegarde...
robocopy backup-2024-12-30 . /E /XD backup-2024-12-30 backup-recent node_modules .git /XF *.log

echo.
echo ✅ Restauration terminée !
echo.
echo 📋 ÉTAPES SUIVANTES :
echo.
echo 1. Redémarrer le terminal
echo 2. cd boulangerie-planning
echo 3. npm install (dans backend et frontend)
echo 4. Vérifier les variables d'environnement
echo 5. Tester l'application
echo.
echo 🚨 ATTENTION : 
echo - Les modifications récentes sont dans backup-recent/
echo - Vérifiez les fichiers de configuration
echo - Redéployez sur Render si nécessaire
echo.
pause




