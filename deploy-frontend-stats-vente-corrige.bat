@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND - STATS VENTE CORRIGE
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
if not exist "deploy-ovh-corrige" mkdir deploy-ovh-corrige
xcopy "frontend\build\*" "deploy-ovh-corrige\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-corrige\.htaccess
echo RewriteEngine On >> deploy-ovh-corrige\.htaccess
echo. >> deploy-ovh-corrige\.htaccess
echo # Redirection des routes React >> deploy-ovh-corrige\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-corrige\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-corrige\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-corrige\.htaccess
echo. >> deploy-ovh-corrige\.htaccess
echo # Compression GZIP >> deploy-ovh-corrige\.htaccess
echo <IfModule mod_deflate.c> >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE text/plain >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE text/html >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE text/xml >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE text/css >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE application/xml >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE application/xhtml+xml >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE application/rss+xml >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE application/javascript >> deploy-ovh-corrige\.htaccess
echo     AddOutputFilterByType DEFLATE application/x-javascript >> deploy-ovh-corrige\.htaccess
echo </IfModule> >> deploy-ovh-corrige\.htaccess
echo. >> deploy-ovh-corrige\.htaccess
echo # Cache des assets statiques >> deploy-ovh-corrige\.htaccess
echo <IfModule mod_expires.c> >> deploy-ovh-corrige\.htaccess
echo     ExpiresActive on >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType text/css "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType application/javascript "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType image/png "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType image/jpg "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType image/jpeg "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType image/gif "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo     ExpiresByType image/svg+xml "access plus 1 year" >> deploy-ovh-corrige\.htaccess
echo </IfModule> >> deploy-ovh-corrige\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend corrigé prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh-corrige\
echo 📋 Contenu :
dir deploy-ovh-corrige /B
echo.
echo 🔧 CORRECTIONS IMPLÉMENTÉES :
echo    ✅ Bouton "Effacer le mois" supprimé
echo    ✅ Boutons d'effacement individuels par employé
echo    ✅ Colonne "Actions" ajoutée au tableau
echo    ✅ Interface plus claire et intuitive
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Allez dans le gestionnaire de fichiers
echo    3. Uploadez TOUS les fichiers du dossier deploy-ovh-corrige\
echo    4. Assurez-vous que .htaccess est bien présent
echo.
echo ⚠️  ATTENTION : Ne pas oublier le fichier .htaccess !
echo.

pause

