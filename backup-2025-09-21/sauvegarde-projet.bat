@echo off
echo ========================================
echo    SAUVEGARDE PROJET BOULANGERIE
echo ========================================
echo.

REM Obtenir la date actuelle
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD%-%HH%h%Min%"

set "backup_folder=backup-%YYYY%-%MM%-%DD%"

echo 📅 Date de sauvegarde: %timestamp%
echo 📁 Dossier de sauvegarde: %backup_folder%
echo.

REM Créer le dossier de sauvegarde
if not exist "%backup_folder%" mkdir "%backup_folder%"

echo 🔄 Début de la sauvegarde...
echo.

REM Sauvegarder tous les fichiers sauf node_modules et .git
robocopy . "%backup_folder%" /E /XD node_modules .git %backup_folder% /XF *.log /R:3 /W:1

echo.
echo ✅ Sauvegarde terminée !
echo.
echo 📋 INFORMATIONS :
echo.
echo - Dossier: %backup_folder%
echo - Taille: Vérifiez avec: dir "%backup_folder%"
echo - Exclusions: node_modules, .git, *.log
echo.
echo 🔄 Pour restaurer plus tard :
echo   1. Utilisez: restaurer-projet.bat
echo   2. Ou copiez manuellement le contenu de %backup_folder%
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




