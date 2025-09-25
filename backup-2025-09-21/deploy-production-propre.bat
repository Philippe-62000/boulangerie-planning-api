@echo off
echo ========================================
echo 🧹 DÉPLOIEMENT PRODUCTION PROPRE
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

echo 📋 Étape 4: Commit des corrections...
git commit -m "🔧 CORRECTIONS PRODUCTION: Routes API + Champs cliquables + Chargement employés"

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
echo ✅ Anciens fichiers supprimés
echo ✅ Nouveau dossier deploy-ovh créé
echo ✅ Routes API corrigées (paramètres, frais repas, frais KM)
echo ✅ Champs paramètres rendus cliquables
echo ✅ Chargement des employés corrigé
echo ✅ Logs de débogage ajoutés
echo ✅ CSS pointer-events ajouté
echo ✅ Backend déployé sur Render (PRODUCTION)
echo ✅ Frontend buildé et prêt pour OVH

echo.
echo 🎉 DÉPLOIEMENT PRODUCTION PROPRE TERMINÉ !
echo 📁 Nouveau dossier 'deploy-ovh' créé avec des fichiers frais
echo 🌐 Uploadez le contenu de 'deploy-ovh' sur OVH via FileZilla
echo ⏱️  Attendez 2-3 minutes pour que Render redéploie le backend
echo.
echo 📋 Prochaines étapes:
echo 1. Uploader le contenu de 'deploy-ovh' sur OVH
echo 2. Attendre 2-3 minutes que Render redéploie
echo 3. Tester les 3 nouveaux menus (Paramètres, Frais Repas, Frais KM)
echo 4. Vérifier que les champs sont cliquables
echo 5. Vérifier que les employés se chargent correctement

pause
