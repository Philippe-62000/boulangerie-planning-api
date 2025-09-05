@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND - CLASSEMENT CORRIGE
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
if not exist "deploy-ovh-classement" mkdir deploy-ovh-classement
xcopy "frontend\build\*" "deploy-ovh-classement\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-classement\.htaccess
echo RewriteEngine On >> deploy-ovh-classement\.htaccess
echo. >> deploy-ovh-classement\.htaccess
echo # Redirection des routes React >> deploy-ovh-classement\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-classement\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-classement\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-classement\.htaccess
echo. >> deploy-ovh-classement\.htaccess
echo # Compression GZIP >> deploy-ovh-classement\.htaccess
echo <IfModule mod_deflate.c> >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE text/plain >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE text/html >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE text/xml >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE text/css >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE application/xml >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE application/xhtml+xml >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE application/rss+xml >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE application/javascript >> deploy-ovh-classement\.htaccess
echo     AddOutputFilterByType DEFLATE application/x-javascript >> deploy-ovh-classement\.htaccess
echo </IfModule> >> deploy-ovh-classement\.htaccess
echo. >> deploy-ovh-classement\.htaccess
echo # Cache des assets statiques >> deploy-ovh-classement\.htaccess
echo <IfModule mod_expires.c> >> deploy-ovh-classement\.htaccess
echo     ExpiresActive on >> deploy-ovh-classement\.htaccess
echo     ExpiresByType text/css "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo     ExpiresByType application/javascript "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo     ExpiresByType image/png "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo     ExpiresByType image/jpg "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo     ExpiresByType image/jpeg "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo     ExpiresByType image/gif "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo     ExpiresByType image/svg+xml "access plus 1 year" >> deploy-ovh-classement\.htaccess
echo </IfModule> >> deploy-ovh-classement\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend avec classement corrigé prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh-classement\
echo 📋 Contenu :
dir deploy-ovh-classement /B
echo.
echo 🔧 CORRECTIONS IMPLÉMENTÉES :
echo    ✅ Classement des vendeuses maintenant fonctionnel
echo    ✅ Utilise les mêmes données que la saisie
echo    ✅ Tri automatique par score décroissant
echo    ✅ Totaux annuels calculés correctement
echo    ✅ Boutons d'effacement individuels par employé
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Allez dans le gestionnaire de fichiers
echo    3. Uploadez TOUS les fichiers du dossier deploy-ovh-classement\
echo    4. Assurez-vous que .htaccess est bien présent
echo.
echo ⚠️  ATTENTION : Ne pas oublier le fichier .htaccess !
echo.

pause

