@echo off
echo ========================================
echo   PUSH API BACKEND VERS GITHUB
echo ========================================

echo.
echo 1. Creation du dossier temporaire...
if exist temp-api-files rmdir /s /q temp-api-files
mkdir temp-api-files

echo.
echo 2. Copie des fichiers backend...
xcopy backend\* temp-api-files\ /E /I /Y

echo.
echo 3. Git dans le dossier temporaire...
cd temp-api-files
git init
git remote add origin https://github.com/Philippe-62000/boulangerie-planning-api.git

echo.
echo 4. Ajout et commit...
git add .
git commit -m "Version 1.0.3 - Corrections Dashboard et Contraintes"

echo.
echo 5. Push vers GitHub...
git push -f origin HEAD:main

echo.
echo 6. Nettoyage...
cd ..
rmdir /s /q temp-api-files

echo.
echo ✅ SUCCÈS ! API poussée vers GitHub
echo 📡 Render va redéployer automatiquement
echo.
pause





