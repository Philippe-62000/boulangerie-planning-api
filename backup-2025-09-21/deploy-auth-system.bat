@echo off
echo ========================================
echo DEPLOIEMENT SYSTEME AUTHENTIFICATION
echo ========================================

echo [1/4] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [2/4] Préparation du déploiement OVH...
cd ..
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh
xcopy /e /i /y frontend\build\* deploy-ovh\
copy .htaccess-ovh-fixed deploy-ovh\.htaccess
echo ✅ Dossier deploy-ovh préparé

echo [3/4] Déploiement backend vers GitHub...
git add .
git commit -m "🔐 SYSTÈME AUTHENTIFICATION: Login + Rôles + Permissions + Protection routes"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Backend déployé vers GitHub

echo [4/4] Résumé du déploiement...
echo.
echo 🎉 SYSTÈME D'AUTHENTIFICATION DÉPLOYÉ !
echo.
echo 📋 Fonctionnalités ajoutées :
echo    ✅ Page de login avec logo FILMARA
echo    ✅ Authentification Admin/Salarié
echo    ✅ Gestion des rôles et permissions
echo    ✅ Filtrage des menus selon le rôle
echo    ✅ Protection des routes sensibles
echo    ✅ Stockage de session localStorage
echo.
echo 🔑 Identifiants par défaut :
echo    👑 Administrateur : admin2024
echo    👤 Salarié : salarie2024
echo.
echo 📁 Dossier à uploader sur OVH : deploy-ovh/
echo 🌐 Backend : Render.com (déploiement automatique)
echo.
echo ⏳ Prochaines étapes :
echo    1. Uploader le contenu de deploy-ovh/ sur OVH
echo    2. Tester la connexion avec les identifiants
echo    3. Vérifier les permissions selon les rôles
echo.
pause
