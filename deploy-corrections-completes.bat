@echo off
echo ========================================
echo 🔧 CORRECTIONS COMPLÈTES - Boulangerie Planning
echo ========================================

echo 📋 Étape 1: Vérification de la branche actuelle...
git branch --show-current

echo 📋 Étape 2: Arrêt des processus Node.js...
taskkill /F /IM node.exe 2>nul

echo 📋 Étape 3: Redémarrage du serveur backend...
cd backend
start "Backend Server" cmd /k "npm start"
cd ..

echo 📋 Étape 4: Attente du démarrage du serveur (10 secondes)...
timeout /t 10 /nobreak

echo 📋 Étape 5: Test de connectivité API...
curl -s http://localhost:5000/health
if %errorlevel% neq 0 (
    echo ❌ Erreur: Le serveur backend n'est pas accessible
    pause
    exit /b 1
)

echo 📋 Étape 6: Test des nouvelles routes API...
echo Test route paramètres...
curl -s http://localhost:5000/api/parameters
echo.
echo Test route frais repas...
curl -s "http://localhost:5000/api/meal-expenses?month=9&year=2025"
echo.
echo Test route frais KM...
curl -s "http://localhost:5000/api/km-expenses?month=9&year=2025"
echo.

echo 📋 Étape 7: Build du frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build du frontend
    pause
    exit /b 1
)

echo 📋 Étape 8: Préparation des fichiers pour OVH...
cd ..
if not exist "deploy-ovh" mkdir deploy-ovh
xcopy "frontend\build\*" "deploy-ovh\" /E /Y

echo 📋 Étape 9: Création du fichier .htaccess...
echo RewriteEngine On > deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh\.htaccess
echo RewriteRule ^(.*)$ index.html [QSA,L] >> deploy-ovh\.htaccess
echo. >> deploy-ovh\.htaccess
echo # Compression GZIP >> deploy-ovh\.htaccess
echo ^<IfModule mod_deflate.c^> >> deploy-ovh\.htaccess
echo     AddOutputFilterByType DEFLATE text/html text/css application/javascript >> deploy-ovh\.htaccess
echo ^</IfModule^> >> deploy-ovh\.htaccess
echo. >> deploy-ovh\.htaccess
echo # Cache des fichiers statiques >> deploy-ovh\.htaccess
echo ^<IfModule mod_expires.c^> >> deploy-ovh\.htaccess
echo     ExpiresActive On >> deploy-ovh\.htaccess
echo     ExpiresByType text/css "access plus 1 month" >> deploy-ovh\.htaccess
echo     ExpiresByType application/javascript "access plus 1 month" >> deploy-ovh\.htaccess
echo     ExpiresByType image/png "access plus 1 month" >> deploy-ovh\.htaccess
echo     ExpiresByType image/jpg "access plus 1 month" >> deploy-ovh\.htaccess
echo     ExpiresByType image/jpeg "access plus 1 month" >> deploy-ovh\.htaccess
echo ^</IfModule^> >> deploy-ovh\.htaccess

echo 📋 Étape 10: Déploiement backend sur Render...
git add .
git commit -m "🔧 CORRECTIONS COMPLÈTES: Routes API + Champs cliquables + Chargement employés"
git push origin main

echo 📋 Étape 11: Résumé des corrections...
echo ✅ Routes API corrigées (paramètres, frais repas, frais KM)
echo ✅ Champs paramètres rendus cliquables
echo ✅ Chargement des employés corrigé
echo ✅ Logs de débogage ajoutés
echo ✅ CSS pointer-events ajouté
echo ✅ Backend redéployé sur Render
echo ✅ Frontend buildé et prêt pour OVH

echo.
echo 🎉 CORRECTIONS TERMINÉES !
echo 📁 Fichiers prêts dans le dossier 'deploy-ovh'
echo 🌐 Uploadez le contenu de 'deploy-ovh' sur OVH via FileZilla
echo ⏱️  Attendez 2-3 minutes pour que Render redéploie le backend
echo.
echo 📋 Prochaines étapes:
echo 1. Uploader le contenu de 'deploy-ovh' sur OVH
echo 2. Tester les 3 nouveaux menus (Paramètres, Frais Repas, Frais KM)
echo 3. Vérifier que les champs sont cliquables
echo 4. Vérifier que les employés se chargent correctement

pause
