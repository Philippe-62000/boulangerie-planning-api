@echo off
echo ========================================
echo CORRECTION PERMISSIONS MENU
echo ========================================

echo [1/4] Correction des permissions de menu...
echo ✅ Ajout du menu Dashboard
echo ✅ Ajout du menu Constraints
echo ✅ Correction des ordres de menu
echo ✅ Permissions complètes pour admin

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
git commit -m "🔧 CORRECTION PERMISSIONS: Dashboard + Constraints + Ordres menu corrigés"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Corrections déployées vers GitHub

echo.
echo 🎉 PERMISSIONS DE MENU CORRIGÉES !
echo.
echo 📋 Menus ajoutés/corrigés :
echo    ✅ Dashboard (visible admin + salarié)
echo    ✅ Constraints (visible admin uniquement)
echo    ✅ Employee-status (visible admin uniquement)
echo    ✅ Meal-expenses (visible admin + salarié)
echo    ✅ Km-expenses (visible admin + salarié)
echo    ✅ Ordres de menu corrigés
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo ⏳ Prochaines étapes :
echo    1. Attendre le redéploiement Render (2-3 min)
echo    2. Uploader deploy-ovh/ sur OVH
echo    3. Tester l'affichage de tous les menus
echo.
echo 🎯 Tous les menus devraient maintenant s'afficher !
echo.
pause
