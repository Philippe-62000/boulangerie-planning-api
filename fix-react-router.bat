@echo off
echo Correction React Router pour sous-dossier /plan/
echo ================================================

echo.
echo 1. Modification du fichier .htaccess...
echo.

:: Creer un nouveau .htaccess avec les bonnes regles
(
echo # Configuration pour OVH Hébergement Web
echo RewriteEngine On
echo.
echo # Redirection API vers le backend
echo RewriteRule ^api/.*$ api/$1 [L]
echo.
echo # Redirection React Router pour sous-dossier /plan/
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo.
echo # Redirection specifique pour les routes React
echo RewriteRule ^plan/employees$ /plan/index.html [L]
echo RewriteRule ^plan/constraints$ /plan/index.html [L]
echo RewriteRule ^plan/planning$ /plan/index.html [L]
echo RewriteRule ^plan/view$ /plan/index.html [L]
echo.
echo # Redirection generale
echo RewriteRule . index.html [L]
echo.
echo # Securite
echo ^<Files ".htaccess"^>
echo     Order allow,deny
echo     Deny from all
echo ^</Files^>
echo.
echo # Cache pour les fichiers statiques
echo ^<IfModule mod_expires.c^>
echo     ExpiresActive on
echo     ExpiresByType text/css "access plus 1 year"
echo     ExpiresByType application/javascript "access plus 1 year"
echo     ExpiresByType image/png "access plus 1 year"
echo     ExpiresByType image/jpg "access plus 1 year"
echo     ExpiresByType image/jpeg "access plus 1 year"
echo     ExpiresByType image/gif "access plus 1 year"
echo     ExpiresByType image/svg+xml "access plus 1 year"
echo ^</IfModule^>
) > deploy\www\.htaccess

echo.
echo 2. Modification du fichier index.html...
echo.

:: Ajouter un script pour corriger les liens
(
echo ^<!doctype html^>^<html lang="fr"^>^<head^>^<meta charset="utf-8"/^>^<link rel="icon" href="/favicon.ico"/^>^<meta name="viewport" content="width=device-width,initial-scale=1"/^>^<meta name="theme-color" content="#667eea"/^>^<meta name="description" content="Système de planification du personnel pour boulangerie"/^>^<title^>Planning Boulangerie^</title^>^<script src="config.js"^>^</script^>^<script defer="defer" src="static/js/main.98512f67.js"^>^</script^>^<link href="static/css/main.bda8b6f7.css" rel="stylesheet"^>^</head^>^<body^>^<noscript^>Vous devez activer JavaScript pour utiliser cette application.^</noscript^>^<div id="root"^>^</div^>
echo.
echo ^<script^>
echo // Correction automatique des liens React Router
echo document.addEventListener^('DOMContentLoaded', function^(^) {
echo     // Attendre que React soit charge
echo     setTimeout^(function^(^) {
echo         // Corriger tous les liens
echo         const links = document.querySelectorAll^('a[href^="/"]'^);
echo         links.forEach^(function^(link^) {
echo             const href = link.getAttribute^('href'^);
echo             if ^(href ^&^& href.startsWith^('/'^) ^&^& !href.startsWith^('/plan'^) ^&^& href !== '/'^) {
echo                 link.setAttribute^('href', '/plan' + href^);
echo             }
echo         }^);
echo.
echo         // Corriger la navigation programmatique
echo         const originalPushState = history.pushState;
echo         history.pushState = function^(state, title, url^) {
echo             if ^(url ^&^& url.startsWith^('/'^) ^&^& !url.startsWith^('/plan'^) ^&^& url !== '/'^) {
echo                 url = '/plan' + url;
echo             }
echo             return originalPushState.call^(this, state, title, url^);
echo         };
echo     }, 2000^);
echo }^);
echo ^</script^>
echo ^</body^>^</html^>
) > deploy\www\index.html

echo.
echo 3. Fichiers modifies avec succes !
echo.
echo Maintenant uploadez ces fichiers sur OVH :
echo - deploy\www\.htaccess
echo - deploy\www\index.html
echo.
echo Puis testez :
echo - https://www.filmara.fr/plan/employees
echo - https://www.filmara.fr/plan/constraints
echo - https://www.filmara.fr/plan/planning
echo - https://www.filmara.fr/plan/view
echo.
pause
