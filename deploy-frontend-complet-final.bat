@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND COMPLET - FINAL
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
if not exist "deploy-ovh-final" mkdir deploy-ovh-final
xcopy "frontend\build\*" "deploy-ovh-final\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-final\.htaccess
echo RewriteEngine On >> deploy-ovh-final\.htaccess
echo. >> deploy-ovh-final\.htaccess
echo # Redirection des routes React >> deploy-ovh-final\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-final\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-final\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-final\.htaccess
echo. >> deploy-ovh-final\.htaccess
echo # Compression GZIP >> deploy-ovh-final\.htaccess
echo <IfModule mod_deflate.c> >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE text/plain >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE text/html >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE text/xml >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE text/css >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE application/xml >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE application/xhtml+xml >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE application/rss+xml >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE application/javascript >> deploy-ovh-final\.htaccess
echo     AddOutputFilterByType DEFLATE application/x-javascript >> deploy-ovh-final\.htaccess
echo </IfModule> >> deploy-ovh-final\.htaccess
echo. >> deploy-ovh-final\.htaccess
echo # Cache des assets statiques >> deploy-ovh-final\.htaccess
echo <IfModule mod_expires.c> >> deploy-ovh-final\.htaccess
echo     ExpiresActive on >> deploy-ovh-final\.htaccess
echo     ExpiresByType text/css "access plus 1 year" >> deploy-ovh-final\.htaccess
echo     ExpiresByType application/javascript "access plus 1 year" >> deploy-ovh-final\.htaccess
echo     ExpiresByType image/png "access plus 1 year" >> deploy-ovh-final\.htaccess
echo     ExpiresByType image/jpg "access plus 1 year" >> deploy-ovh-final\.htaccess
echo     ExpiresByType image/jpeg "access plus 1 year" >> deploy-ovh-final\.htaccess
echo     ExpiresByType image/gif "access plus 1 year" >> deploy-ovh-final\.htaccess
echo     ExpiresByType image/svg+xml "access plus 1 year" >> deploy-ovh-final\.htaccess
echo </IfModule> >> deploy-ovh-final\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend complet prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh-final\
echo 📋 Contenu :
dir deploy-ovh-final /B
echo.
echo 🎯 TOUTES LES CORRECTIONS IMPLÉMENTÉES :
echo    ✅ Classement des vendeuses maintenant fonctionnel
echo    ✅ Utilise les mêmes données que la saisie
echo    ✅ Tri automatique par score décroissant
echo    ✅ Totaux annuels calculés correctement
echo    ✅ Boutons d'effacement individuels par employé
echo    ✅ Bouton "Effacer le mois" global supprimé
echo    ✅ Colonne "Actions" ajoutée au tableau
echo    ✅ Gestion des années centralisée et configurable
echo    ✅ Interface plus claire et intuitive
echo.
echo 🔧 FONCTIONNALITÉS AJOUTÉES :
echo    📊 Saisie des données mensuelles avec boutons d'effacement individuels
echo    🏆 Classement des vendeuses avec tri automatique par score
echo    📈 Comparaison sur 12 mois avec plage d'années étendue
echo    🗑️ Suppression individuelle des données par employé
echo    📅 Gestion flexible des années (configurable via YEAR_RANGE et YEARS_BACK)
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Allez dans le gestionnaire de fichiers
echo    3. Uploadez TOUS les fichiers du dossier deploy-ovh-final\
echo    4. Assurez-vous que .htaccess est bien présent
echo.
echo ⚠️  ATTENTION : Ne pas oublier le fichier .htaccess !
echo.
echo 📚 DOCUMENTATION DISPONIBLE :
echo    - DOCUMENTATION-ANNEES-SALES-STATS.md : Guide complet pour modifier les années
echo    - ARCHITECTURE-PROJET.md : Documentation générale du projet
echo.
echo 🎉 Frontend prêt avec toutes les améliorations !
echo.

pause

