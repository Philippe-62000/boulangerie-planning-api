@echo off
echo ========================================
echo CORRECTION LOGO + MENUS ADMINISTRATEUR
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Logo FILMARA corrigé (orque + renard stylisés)
echo ✅ Menus "Frais Repas" et "Frais KM" ajoutés pour admin
echo ✅ Permissions par défaut mises à jour

echo [2/4] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit avec succès

echo [3/4] Préparation du déploiement OVH...
cd ..
if exist deploy-ovh rmdir /s /q deploy-ovh
mkdir deploy-ovh
xcopy /e /i /y frontend\build\* deploy-ovh\
copy .htaccess-ovh-fixed deploy-ovh\.htaccess
echo ✅ Dossier deploy-ovh préparé

echo [4/4] Déploiement vers GitHub...
git add .
git commit -m "🎨 FIX LOGO + MENUS: Logo FILMARA corrigé + Menus admin complets"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 CORRECTIONS LOGO + MENUS APPLIQUÉES !
echo.
echo 📋 Problèmes résolus :
echo    ✅ Logo FILMARA avec orque et renard stylisés
echo    ✅ Menus "Frais Repas" et "Frais KM" visibles pour admin
echo    ✅ Sous-menu "État Salariés" complet
echo.
echo 📁 Dossier à uploader sur OVH : deploy-ovh/
echo.
echo ⏳ Prochaines étapes :
echo    1. Uploader le contenu de deploy-ovh/ sur OVH
echo    2. Tester la connexion administrateur
echo    3. Vérifier que tous les menus s'affichent
echo.
echo 🎯 Le système sera maintenant complet !
echo.
pause
