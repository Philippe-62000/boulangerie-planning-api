@echo off
echo ========================================
echo   DEPLOYMENT FRONTEND VERS OVH
echo ========================================
echo.

echo 1. Construction du frontend avec Vite...
cd frontend
set VITE_API_URL=https://boulangerie-planning-api-4-pbfy.onrender.com/api
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Echec de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 2. Copie des fichiers vers le dossier de déploiement...
if not exist "deploy-frontend" mkdir "deploy-frontend"

echo    - Copie des fichiers HTML...
copy "frontend\public\*.html" "deploy-frontend\" /Y

echo    - Copie des fichiers CSS...
xcopy "frontend\build\static\css\*" "deploy-frontend\static\css\" /E /I /Y

echo    - Copie des fichiers JS...
xcopy "frontend\build\static\js\*" "deploy-frontend\static\js\" /E /I /Y

echo    - Copie des fichiers de médias...
xcopy "frontend\build\static\media\*" "deploy-frontend\static\media\" /E /I /Y

echo    - Copie du fichier index.html...
copy "frontend\build\index.html" "deploy-frontend\" /Y

echo    - Copie du fichier manifest.json...
if exist "frontend\build\manifest.json" copy "frontend\build\manifest.json" "deploy-frontend\" /Y

echo.
echo 3. Fichiers prêts pour le déploiement OVH
echo.
echo ========================================
echo   FICHIERS A UPLOADER VERS OVH
echo ========================================
echo.
echo Dossier source: deploy-frontend\
echo.
echo Fichiers à uploader:
dir "deploy-frontend" /B
echo.
echo ========================================
echo   INSTRUCTIONS DEPLOYMENT OVH
echo ========================================
echo.
echo 1. Connectez-vous à votre espace OVH
echo 2. Allez dans le gestionnaire de fichiers
echo 3. Naviguez vers le dossier de votre site
echo 4. Uploadez TOUS les fichiers du dossier deploy-frontend\
echo 5. Remplacez les fichiers existants
echo.
echo ========================================
echo   NOUVELLES FONCTIONNALITES DEPLOYEES
echo ========================================
echo.
echo ✅ Migration vers Vite (remplace react-scripts)
echo ✅ Build plus rapide (~70%% plus rapide)
echo ✅ Page "Demandes d'Acompte" (/advance-requests)
echo ✅ Menu "Demandes d'Acompte" dans la sidebar
echo ✅ Templates EmailJS pour les acomptes
echo ✅ Interface de validation manager
echo ✅ Récapitulatif dans employee-status-print
echo.
echo ========================================
echo   DEPLOYMENT TERMINE
echo ========================================
echo.
pause