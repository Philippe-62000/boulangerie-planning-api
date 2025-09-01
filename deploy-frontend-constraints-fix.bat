@echo off
echo ========================================
echo   DEPLOY FRONTEND - FIX CONTRAINTES
echo ========================================

echo.
echo 1. Nettoyage du dossier deploy...
if exist deploy\www rmdir /s /q deploy\www
mkdir deploy\www

echo.
echo 2. Build du frontend avec les corrections...
cd frontend
call npm run build
cd ..

echo.
echo 3. Copie des fichiers build vers deploy/www...
xcopy frontend\build\* deploy\www\ /E /I /Y

echo.
echo 4. Creation du fichier .htaccess...
echo RewriteEngine On > deploy\www\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy\www\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy\www\.htaccess
echo RewriteRule ^(.*)$ /plan/index.html [L] >> deploy\www\.htaccess
echo. >> deploy\www\.htaccess
echo # Headers de sécurité >> deploy\www\.htaccess
echo Header always set X-Content-Type-Options nosniff >> deploy\www\.htaccess
echo Header always set X-Frame-Options DENY >> deploy\www\.htaccess
echo Header always set X-XSS-Protection "1; mode=block" >> deploy\www\.htaccess
echo. >> deploy\www\.htaccess
echo # Cache control >> deploy\www\.htaccess
echo ExpiresActive On >> deploy\www\.htaccess
echo ExpiresByType text/css "access plus 1 year" >> deploy\www\.htaccess
echo ExpiresByType application/javascript "access plus 1 year" >> deploy\www\.htaccess

echo.
echo 5. Upload vers OVH...
powershell -ExecutionPolicy Bypass -File upload-to-ovh.ps1

echo.
echo ✅ SUCCÈS ! Frontend déployé sur OVH avec les corrections
echo 🌐 Le site est maintenant à jour avec les corrections des contraintes
echo.
pause



