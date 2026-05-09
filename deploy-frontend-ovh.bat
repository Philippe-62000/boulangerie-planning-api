@echo off
echo ========================================
echo   ARRAS — frontend vers dossier deploy-ovh (OVH /plan/)
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
echo 2. Copie des fichiers vers deploy-ovh (upload habituel Arras)...
if not exist "deploy-ovh" mkdir "deploy-ovh"

echo    - Copie du fichier index.html (du build, pas de public)...
copy "frontend\build\index.html" "deploy-ovh\" /Y

echo    - Copie des autres fichiers HTML de public (daily-losses-entry, stocks-farines-standalone, etc.)...
for %%f in (frontend\public\*.html) do (
    if /i not "%%~nxf"=="index.html" (
        copy "%%f" "deploy-ovh\" /Y
    )
)

echo    - Copie des fichiers CSS...
xcopy "frontend\build\static\css\*" "deploy-ovh\static\css\" /E /I /Y

echo    - Copie des fichiers JS...
xcopy "frontend\build\static\js\*" "deploy-ovh\static\js\" /E /I /Y

echo    - Copie des fichiers de médias...
xcopy "frontend\build\static\media\*" "deploy-ovh\static\media\" /E /I /Y

echo    - Copie du fichier manifest.json...
if exist "frontend\build\manifest.json" copy "frontend\build\manifest.json" "deploy-ovh\" /Y

echo    - Copie du .htaccess (build / racine frontend si présent)...
if exist "frontend\build\.htaccess" copy "frontend\build\.htaccess" "deploy-ovh\.htaccess" /Y

echo.
echo 3. Fichiers prêts pour le déploiement OVH
echo.
echo ========================================
echo   FICHIERS A UPLOADER VERS OVH
echo ========================================
echo.
echo Dossier source: deploy-ovh\
echo Destination FTP habituelle: dossier /plan/ sur OVH
echo.
echo Fichiers à uploader:
dir "deploy-ovh" /B
echo.
echo ========================================
echo   INSTRUCTIONS DEPLOYMENT OVH
echo ========================================
echo.
echo 1. Connectez-vous à votre espace OVH
echo 2. Allez dans le gestionnaire de fichiers (ou FileZilla)
echo 3. Naviguez vers le dossier /plan/ du site
echo 4. Uploadez TOUS les fichiers du dossier deploy-ovh\
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