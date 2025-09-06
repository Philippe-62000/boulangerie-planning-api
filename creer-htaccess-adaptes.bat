@echo off
echo ========================================
echo 🔧 CRÉATION .HTACCESS ADAPTÉS
echo ========================================

echo 📋 Étape 1: Création du dossier de test...
if exist "test-htaccess" rmdir /s /q "test-htaccess"
mkdir test-htaccess

echo 📋 Étape 2: Copie des fichiers de base...
xcopy "frontend\build\*" "test-htaccess\" /E /Y

echo 📋 Étape 3: Création .htaccess pour RACINE (www.filmara.fr/)...
echo RewriteEngine On > test-htaccess\.htaccess-racine
echo RewriteCond %%{REQUEST_FILENAME} !-f >> test-htaccess\.htaccess-racine
echo RewriteCond %%{REQUEST_FILENAME} !-d >> test-htaccess\.htaccess-racine
echo RewriteRule ^(.*)$ index.html [L] >> test-htaccess\.htaccess-racine

echo 📋 Étape 4: Création .htaccess pour /plan/ (www.filmara.fr/plan/)...
echo RewriteEngine On > test-htaccess\.htaccess-plan
echo RewriteBase /plan/ >> test-htaccess\.htaccess-plan
echo RewriteCond %%{REQUEST_FILENAME} !-f >> test-htaccess\.htaccess-plan
echo RewriteCond %%{REQUEST_FILENAME} !-d >> test-htaccess\.htaccess-plan
echo RewriteRule . /plan/index.html [L] >> test-htaccess\.htaccess-plan

echo 📋 Étape 5: Création .htaccess universel...
echo RewriteEngine On > test-htaccess\.htaccess-universel
echo. >> test-htaccess\.htaccess-universel
echo # Pour la racine >> test-htaccess\.htaccess-universel
echo RewriteCond %%{REQUEST_FILENAME} !-f >> test-htaccess\.htaccess-universel
echo RewriteCond %%{REQUEST_FILENAME} !-d >> test-htaccess\.htaccess-universel
echo RewriteRule ^(.*)$ index.html [L] >> test-htaccess\.htaccess-universel
echo. >> test-htaccess\.htaccess-universel
echo # Pour /plan/ >> test-htaccess\.htaccess-universel
echo RewriteCond %%{REQUEST_URI} ^/plan/ >> test-htaccess\.htaccess-universel
echo RewriteCond %%{REQUEST_FILENAME} !-f >> test-htaccess\.htaccess-universel
echo RewriteCond %%{REQUEST_FILENAME} !-d >> test-htaccess\.htaccess-universel
echo RewriteRule ^(.*)$ /plan/index.html [L] >> test-htaccess\.htaccess-universel

echo.
echo 🎯 INSTRUCTIONS:
echo.
echo 📁 Pour la RACINE (www.filmara.fr/):
echo 1. Uploadez le contenu de 'test-htaccess' sur la racine
echo 2. Renommez .htaccess-racine en .htaccess
echo.
echo 📁 Pour /plan/ (www.filmara.fr/plan/):
echo 1. Uploadez le contenu de 'test-htaccess' dans le dossier /plan/
echo 2. Renommez .htaccess-plan en .htaccess
echo.
echo 📁 Pour les DEUX (universel):
echo 1. Uploadez le contenu de 'test-htaccess' sur la racine
echo 2. Renommez .htaccess-universel en .htaccess
echo.
echo 📄 Fichiers créés:
echo ✅ .htaccess-racine (pour www.filmara.fr/)
echo ✅ .htaccess-plan (pour www.filmara.fr/plan/)
echo ✅ .htaccess-universel (pour les deux)

pause


