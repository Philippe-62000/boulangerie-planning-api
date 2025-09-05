@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND RAPIDE
echo ========================================
echo.

echo 📁 Changement vers le dossier frontend...
cd frontend

echo 🔧 Construction du frontend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo ✅ Frontend construit avec succès
echo.

echo 📁 Retour au dossier racine...
cd ..

echo 📁 Copie des fichiers vers le dossier de déploiement...
if not exist "deploy-ovh-rapide" mkdir deploy-ovh-rapide
xcopy "frontend\build\*" "deploy-ovh-rapide\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-rapide\.htaccess
echo RewriteEngine On >> deploy-ovh-rapide\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-rapide\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-rapide\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-rapide\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh-rapide\
echo 📋 Contenu :
dir deploy-ovh-rapide /B
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Uploadez TOUS les fichiers du dossier deploy-ovh-rapide\
echo    3. Assurez-vous que .htaccess est bien présent
echo.

pause

