@echo off
echo ========================================
echo   PUSH API - SYSTEME ABSENCES
echo ========================================

echo.
echo 1. Creation d'un dossier temporaire pour l'API...
if exist temp-api-files rmdir /s /q temp-api-files
mkdir temp-api-files

echo.
echo 2. Copie des fichiers backend uniquement...
xcopy backend\* temp-api-files\ /E /I /Y

echo.
echo 3. Creation du fichier VERSION.md...
cd temp-api-files
echo Version : 1.1.0 > VERSION.md
echo Date : %date:~-4,4%/%date:~-7,2%/%date:~-10,2% >> VERSION.md
echo Heure : %time:~0,2%:%time:~3,2%:%time:~6,2% >> VERSION.md
echo Commit : Ajout systeme absences complet >> VERSION.md
echo Statut : ⏳ En cours de deploiement >> VERSION.md

echo.
echo 4. Initialisation Git dans le dossier temporaire...
git init
git remote add origin https://github.com/Philippe-62000/boulangerie-planning-api.git

echo.
echo 5. Ajout de tous les fichiers...
git add .

echo.
echo 6. Commit des modifications...
git commit -m "Version 1.1.0 - Ajout systeme absences complet - Date: %date:~-4,4%/%date:~-7,2%/%date:~-10,2% %time:~0,2%:%time:~3,2%"

echo.
echo 7. Force push vers GitHub (branche main)...
git push -f origin master:main

echo.
echo 8. Mise a jour du statut de deploiement...
echo Version : 1.1.0 > VERSION.md
echo Date : %date:~-4,4%/%date:~-7,2%/%date:~-10,2% >> VERSION.md
echo Heure : %time:~0,2%:%time:~3,2%:%time:~6,2% >> VERSION.md
echo Commit : Ajout systeme absences complet >> VERSION.md
echo Statut : ✅ Deploye >> VERSION.md

echo.
echo 9. Nettoyage...
cd ..
rmdir /s /q temp-api-files

echo.
echo ✅ SUCCÈS ! API force poussée vers GitHub (branche main)
echo 📡 Render va redéployer automatiquement
echo.
echo 10. Verification...
echo URL: https://github.com/Philippe-62000/boulangerie-planning-api
echo BRANCHE: main (celle déployée sur Render)
echo VERSION: Vérifiez le fichier VERSION.md pour confirmer le déploiement
echo.
pause
