@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT OVH RAPIDE - CORRIGÉ
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

echo 📋 Étape 4: Création du fichier .htaccess correct...
echo RewriteEngine On > deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh\.htaccess
echo RewriteRule ^(.*)$ index.html [QSA,L] >> deploy-ovh\.htaccess
echo. >> deploy-ovh\.htaccess
echo # Compression GZIP >> deploy-ovh\.htaccess
echo ^<IfModule mod_deflate.c^> >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE text/html text/css application/javascript >> deploy-ovh\.htaccess
echo ^</IfModule^> >> deploy-ovh\.htaccess

echo 📋 Étape 5: Vérification du contenu...
echo Contenu du dossier deploy-ovh:
dir deploy-ovh

echo 📋 Étape 6: Vérification du .htaccess...
echo Contenu du fichier .htaccess:
type deploy-ovh\.htaccess

echo.
echo 🎉 DÉPLOIEMENT OVH PRÊT !
echo 📁 Uploadez le contenu de 'deploy-ovh' sur OVH via FileZilla
echo ✅ Fichier .htaccess corrigé et fonctionnel
echo ✅ Toutes les corrections incluses

pause

