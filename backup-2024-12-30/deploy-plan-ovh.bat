@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT /plan/ OVH
echo ========================================

echo 📋 Étape 1: Nettoyage du dossier deploy-ovh...
if exist "deploy-ovh" rmdir /s /q "deploy-ovh"
mkdir deploy-ovh

echo 📋 Étape 2: Build du frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build du frontend
    pause
    exit /b 1
)

echo 📋 Étape 3: Copie des fichiers...
cd ..
xcopy "frontend\build\*" "deploy-ovh\" /E /Y

echo 📋 Étape 4: Création du fichier .htaccess pour /plan/...
echo RewriteEngine On > deploy-ovh\.htaccess
echo RewriteBase /plan/ >> deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh\.htaccess
echo RewriteRule . /plan/index.html [L] >> deploy-ovh\.htaccess

echo 📋 Étape 5: Vérification du contenu...
echo Contenu du dossier deploy-ovh:
dir deploy-ovh

echo 📋 Étape 6: Vérification du .htaccess...
echo Contenu du fichier .htaccess:
type deploy-ovh\.htaccess

echo.
echo 🎉 DÉPLOIEMENT /plan/ PRÊT !
echo.
echo 📁 INSTRUCTIONS DE DÉPLOIEMENT:
echo 1. Uploadez TOUT le contenu de 'deploy-ovh' dans le dossier /plan/ sur OVH
echo 2. L'URL sera: https://www.filmara.fr/plan/
echo 3. NE mettez RIEN à la racine (www.filmara.fr/)
echo.
echo ✅ Configuration React: homepage="/plan/"
echo ✅ .htaccess configuré pour /plan/
echo ✅ Toutes les corrections incluses
echo.
echo 🌐 URL finale: https://www.filmara.fr/plan/

pause


