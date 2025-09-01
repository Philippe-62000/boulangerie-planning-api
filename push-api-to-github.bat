@echo off
echo ========================================
echo   PUSH API BACKEND VERS GITHUB
echo ========================================

echo.
echo 1. Creation d'un dossier temporaire pour l'API...
if exist temp-api-files rmdir /s /q temp-api-files
mkdir temp-api-files

echo.
echo 2. Copie des fichiers backend...
xcopy backend\* temp-api-files\ /E /I /Y

echo.
echo 3. Initialisation Git dans le dossier temporaire...
cd temp-api-files
git init
git remote add origin https://github.com/Philippe-62000/boulangerie-planning-api.git

echo.
echo 4. Ajout de tous les fichiers...
git add .

echo.
echo 5. Commit des modifications...
git commit -m "Ajout endpoint sick-leave et fonction declareSickLeave - Ajout route PATCH /employees/:id/sick-leave - Ajout fonction declareSickLeave dans employeeController"

echo.
echo 6. Push vers GitHub...
git push -u origin master

echo.
echo 7. Nettoyage...
cd ..
rmdir /s /q temp-api-files

echo.
echo ✅ SUCCÈS ! API poussée vers GitHub
echo 📡 Render va redéployer automatiquement
echo.
pause
