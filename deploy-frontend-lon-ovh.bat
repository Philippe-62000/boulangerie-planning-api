@echo off
echo ========================================
echo   DEPLOYMENT FRONTEND LONGUENESSE VERS OVH
echo ========================================
echo.

echo 1. Construction du frontend avec Vite pour /lon...
cd frontend
set VITE_API_URL=https://boulangerie-planning-api-3.onrender.com/api
call npm run build -- --base=/lon/
if %errorlevel% neq 0 (
    echo ERREUR: Echec de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 2. Copie des fichiers vers le dossier de déploiement...
if not exist "deploy-frontend-lon" mkdir "deploy-frontend-lon"

echo    - Copie des fichiers...
xcopy "frontend\build\*" "deploy-frontend-lon\" /E /I /Y

echo    - Création du .htaccess pour /lon/...
echo RewriteEngine On > deploy-frontend-lon\.htaccess
echo RewriteBase /lon/ >> deploy-frontend-lon\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-frontend-lon\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-frontend-lon\.htaccess
echo RewriteRule . /lon/index.html [L] >> deploy-frontend-lon\.htaccess

echo.
echo ✅ Fichiers prêts pour le déploiement OVH
echo 📁 Dossier: deploy-frontend-lon\
echo 🌐 URL: https://www.filmara.fr/lon/
echo.
echo ========================================
echo   INSTRUCTIONS DEPLOYMENT OVH
echo ========================================
echo.
echo 1. Uploadez TOUT le contenu de 'deploy-frontend-lon' dans le dossier /lon/ sur OVH
echo 2. L'URL sera: https://www.filmara.fr/lon/
echo 3. NE mettez RIEN à la racine (www.filmara.fr/)
echo.
echo ✅ Configuration Vite: base="/lon/"
echo ✅ .htaccess configuré pour /lon/
echo.
pause

