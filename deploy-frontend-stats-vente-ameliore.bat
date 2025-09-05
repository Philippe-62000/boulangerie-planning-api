@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND - STATS VENTE AMELIORE
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
if not exist "deploy-ovh" mkdir deploy-ovh
xcopy "frontend\build\*" "deploy-ovh\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh\.htaccess
echo RewriteEngine On >> deploy-ovh\.htaccess
echo. >> deploy-ovh\.htaccess
echo # Redirection des routes React >> deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh\.htaccess
echo. >> deploy-ovh\.htaccess
echo # Compression GZIP >> deploy-ovh\.htaccess
echo <IfModule mod_deflate.c> >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE text/plain >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE text/html >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE text/xml >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE text/css >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE application/xml >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE application/xhtml+xml >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE application/rss+xml >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE application/javascript >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE application/x-javascript >> deploy-ovh\.htaccess
echo </IfModule> >> deploy-ovh\.htaccess
echo. >> deploy-ovh\.htaccess
echo # Cache des assets statiques >> deploy-ovh\.htaccess
echo <IfModule mod_expires.c> >> deploy-ovh\.htaccess
echo     ExpiresActive on >> deploy-ovh\.htaccess
echo     ExpiresByType text/css "access plus 1 year" >> deploy-ovh\.htaccess
echo     ExpiresByType application/javascript "access plus 1 year" >> deploy-ovh\.htaccess
echo     ExpiresByType image/png "access plus 1 year" >> deploy-ovh\.htaccess
echo     ExpiresByType image/jpg "access plus 1 year" >> deploy-ovh\.htaccess
echo     ExpiresByType image/jpeg "access plus 1 year" >> deploy-ovh\.htaccess
echo     ExpiresByType image/gif "access plus 1 year" >> deploy-ovh\.htaccess
echo     ExpiresByType image/svg+xml "access plus 1 year" >> deploy-ovh\.htaccess
echo </IfModule> >> deploy-ovh\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh\
echo 📋 Contenu :
dir deploy-ovh /B
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Allez dans le gestionnaire de fichiers
echo    3. Uploadez TOUS les fichiers du dossier deploy-ovh\
echo    4. Assurez-vous que .htaccess est bien présent
echo.
echo ⚠️  ATTENTION : Ne pas oublier le fichier .htaccess !
echo.

pause
