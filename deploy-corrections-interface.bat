@echo off
echo ========================================
echo 🔧 CORRECTIONS INTERFACE - Boulangerie Planning
echo ========================================

echo 📋 Étape 1: Nettoyage des anciens fichiers...
if exist "deploy-ovh" (
    echo Suppression de l'ancien dossier deploy-ovh...
    rmdir /s /q deploy-ovh
)

echo 📋 Étape 2: Vérification de la branche actuelle...
git branch --show-current

echo 📋 Étape 3: Ajout des fichiers modifiés...
git add .

echo 📋 Étape 4: Commit des corrections interface...
git commit -m "🔧 CORRECTIONS INTERFACE: API paramètres + UI améliorée + Frais KM debug"

echo 📋 Étape 5: Déploiement backend sur Render (production)...
git push origin main

echo 📋 Étape 6: Build du frontend pour OVH...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build du frontend
    pause
    exit /b 1
)

echo 📋 Étape 7: Création du nouveau dossier deploy-ovh...
cd ..
mkdir deploy-ovh

echo 📋 Étape 8: Copie des fichiers frais...
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

echo 📋 Étape 10: Vérification du contenu...
echo Contenu du dossier deploy-ovh:
dir deploy-ovh

echo 📋 Étape 11: Résumé des corrections déployées...
echo ✅ API paramètres corrigée (logs de débogage ajoutés)
echo ✅ Premier tableau des paramètres supprimé
echo ✅ Layout frais repas amélioré (contrôles à gauche)
echo ✅ Frais KM avec logs de débogage
echo ✅ Backend déployé sur Render (PRODUCTION)
echo ✅ Frontend buildé et prêt pour OVH

echo.
echo 🎉 CORRECTIONS INTERFACE TERMINÉES !
echo 📁 Nouveau dossier 'deploy-ovh' créé avec des fichiers frais
echo 🌐 Uploadez le contenu de 'deploy-ovh' sur OVH via FileZilla
echo ⏱️  Attendez 2-3 minutes pour que Render redéploie le backend
echo.
echo 📋 Prochaines étapes:
echo 1. Uploader le contenu de 'deploy-ovh' sur OVH
echo 2. Attendre 2-3 minutes que Render redéploie
echo 3. Tester les corrections:
echo    - Paramètres: Plus de premier tableau, sauvegarde fonctionne
echo    - Frais Repas: Contrôles à gauche, colonne Total visible
echo    - Frais KM: Vérifier les logs dans la console pour debug
echo 4. Vérifier que tous les champs sont cliquables

pause
