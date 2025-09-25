@echo off
echo ========================================
echo 🔧 TEST CONFIGURATIONS OVH
echo ========================================

echo 📋 Étape 1: Création du dossier de test...
if exist "test-ovh" rmdir /s /q "test-ovh"
mkdir test-ovh

echo 📋 Étape 2: Copie des fichiers de base...
xcopy "frontend\build\*" "test-ovh\" /E /Y

echo 📋 Étape 3: Test 1 - Sans .htaccess...
echo Test 1: Uploadez le contenu de 'test-ovh' sur OVH SANS fichier .htaccess
echo Si cela fonctionne, le problème vient du .htaccess
echo.

echo 📋 Étape 4: Test 2 - .htaccess minimal...
echo RewriteEngine On > test-ovh\.htaccess
echo RewriteRule ^(.*)$ index.html [L] >> test-ovh\.htaccess
echo Test 2: Uploadez le contenu de 'test-ovh' avec ce .htaccess minimal
echo.

echo 📋 Étape 5: Test 3 - .htaccess alternatif...
echo RewriteEngine On > test-ovh\.htaccess-alt
echo RewriteCond %%{REQUEST_FILENAME} !-f >> test-ovh\.htaccess-alt
echo RewriteCond %%{REQUEST_FILENAME} !-d >> test-ovh\.htaccess-alt
echo RewriteRule . /index.html [L] >> test-ovh\.htaccess-alt
echo Test 3: Renommez .htaccess-alt en .htaccess et uploadez
echo.

echo 📋 Étape 6: Test 4 - .htaccess avec basename...
echo RewriteEngine On > test-ovh\.htaccess-basename
echo RewriteBase /plan/ >> test-ovh\.htaccess-basename
echo RewriteCond %%{REQUEST_FILENAME} !-f >> test-ovh\.htaccess-basename
echo RewriteCond %%{REQUEST_FILENAME} !-d >> test-ovh\.htaccess-basename
echo RewriteRule . /plan/index.html [L] >> test-ovh\.htaccess-basename
echo Test 4: Renommez .htaccess-basename en .htaccess et uploadez
echo.

echo 🎯 STRATÉGIE DE TEST:
echo 1. Commencez par Test 1 (sans .htaccess)
echo 2. Si ça marche, le problème vient du .htaccess
echo 3. Testez ensuite Test 2, 3, 4 dans l'ordre
echo 4. Gardez la configuration qui fonctionne
echo.

echo 📁 Dossier de test créé: test-ovh
echo 📄 Fichiers .htaccess alternatifs créés
echo 🌐 Testez chaque configuration sur OVH

pause

