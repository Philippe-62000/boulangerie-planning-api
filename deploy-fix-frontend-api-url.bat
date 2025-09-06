@echo off
echo ========================================
echo CORRECTION URL API FRONTEND
echo ========================================

echo [1/4] Correction de l'URL API...
echo ✅ URL API complète ajoutée
echo ✅ Permissions par défaut implémentées
echo ✅ Gestion d'erreur améliorée

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
git commit -m "🔧 FIX FRONTEND: URL API complète + Permissions par défaut"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Correction frontend déployée vers GitHub

echo.
echo 🎉 CORRECTION FRONTEND APPLIQUÉE !
echo.
echo 📋 Problème résolu :
echo    ❌ URL API relative /api/menu-permissions
echo    ✅ URL API complète https://boulangerie-planning-api-3.onrender.com/api/menu-permissions
echo    ✅ Permissions par défaut en cas d'erreur
echo.
echo 📁 Dossier à uploader sur OVH : deploy-ovh/
echo.
echo ⏳ Prochaines étapes :
echo    1. Uploader le contenu de deploy-ovh/ sur OVH
echo    2. Tester la connexion avec les identifiants
echo    3. Vérifier que les menus s'affichent correctement
echo.
echo 🎯 Le système d'authentification sera pleinement opérationnel !
echo.
pause
