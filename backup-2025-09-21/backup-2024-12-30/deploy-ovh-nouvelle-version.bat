@echo off
echo ========================================
echo DEPLOIEMENT OVH - NOUVELLE VERSION
echo Frais Repas + Frais KM + Parametres
echo ========================================
echo.

echo [1/6] Construction du frontend...
cd frontend
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo.
echo [2/6] Retour au dossier racine...
cd ..

echo [3/6] Creation du dossier de deploiement OVH...
if not exist "deploy-ovh-nouvelle-version" mkdir deploy-ovh-nouvelle-version

echo [4/6] Copie des fichiers frontend...
xcopy "frontend\build\*" "deploy-ovh-nouvelle-version\" /E /Y /Q
echo ✅ Fichiers frontend copies

echo.
echo [5/6] Copie des fichiers backend...
mkdir "deploy-ovh-nouvelle-version\api"
xcopy "backend\*" "deploy-ovh-nouvelle-version\api\" /E /Y /Q

echo Suppression des dossiers inutiles pour OVH...
rmdir /s /q "deploy-ovh-nouvelle-version\api\node_modules" 2>nul
rmdir /s /q "deploy-ovh-nouvelle-version\api\src" 2>nul
rmdir /s /q "deploy-ovh-nouvelle-version\api\test" 2>nul
echo ✅ Fichiers backend copies

echo.
echo [6/6] Creation du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-nouvelle-version\.htaccess
echo RewriteEngine On >> deploy-ovh-nouvelle-version\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-nouvelle-version\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-nouvelle-version\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-nouvelle-version\.htaccess
echo ✅ Fichier .htaccess cree

echo.
echo ========================================
echo   DEPLOIEMENT OVH TERMINE !
echo ========================================
echo.
echo 📂 Dossier de deploiement : deploy-ovh-nouvelle-version\
echo.
echo 📋 Contenu du dossier :
dir deploy-ovh-nouvelle-version /B
echo.
echo 🚀 NOUVELLES FONCTIONNALITES :
echo    ✅ Parametres KM (12 trajets configurables)
echo    ✅ Frais Repas (saisie mensuelle)
echo    ✅ Frais KM (calcul automatique)
echo    ✅ Impression etat salaries
echo.
echo 💡 UPLOAD MANUEL REQUIS SUR OVH :
echo    1. Connectez-vous a votre espace OVH
echo    2. Uploadez TOUS les fichiers du dossier deploy-ovh-nouvelle-version\
echo    3. Assurez-vous que .htaccess est bien present
echo    4. Redemarrez votre serveur Node.js sur OVH
echo.
echo ⚠️  ATTENTION : 
echo    - Ne pas oublier le fichier .htaccess !
echo    - Redemarrer le serveur Node.js apres upload
echo    - Verifier que MongoDB est accessible
echo.
echo 🌐 URL de votre application : https://www.filmara.fr/plan
echo.
pause

