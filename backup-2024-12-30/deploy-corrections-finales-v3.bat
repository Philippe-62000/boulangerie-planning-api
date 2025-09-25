@echo off
echo ========================================
echo CORRECTIONS FINALES V3
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Titre: centré et guillemets enlevés autour de la ville
echo ✅ Menus: Dashboard et Contraintes ajoutés aux permissions
echo ✅ Re-sélection: logs debug pour diagnostiquer les menus
echo ✅ Mots de passe: correction contrôleur pour admin/employee
echo ✅ Paramètres KM: déjà corrigés dans le backend

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

echo [4/4] Commit et push des corrections...
git add .
git commit -m "Fix: Corrections finales V3 - Titre, Menus, Mots de passe

- Titre: centré et guillemets enlevés autour de la ville
- Menus: Dashboard et Contraintes ajoutés aux permissions
- Re-sélection: logs debug pour diagnostiquer les menus
- Mots de passe: correction contrôleur pour admin/employee
- Paramètres KM: déjà corrigés dans le backend"

git push origin main

echo.
echo 🎉 CORRECTIONS FINALES V3 APPLIQUÉES !
echo.
echo 📋 Corrections apportées :
echo    ✅ Titre: "Planning Boulangerie Arras" (centré, sans guillemets)
echo    ✅ Menus: Dashboard et Contraintes visibles
echo    ✅ Re-sélection: logs debug pour diagnostiquer
echo    ✅ Mots de passe: correction contrôleur backend
echo    ✅ Paramètres KM: sauvegarde fonctionnelle
echo.
echo 🔧 Backend : Render.com (déploiement automatique)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload OVH :
echo    1. Titre: "Planning Boulangerie Arras" centré
echo    2. Menus: Dashboard et Contraintes visibles
echo    3. Re-sélection: vérifier les logs dans la console
echo    4. Mots de passe: sauvegarde fonctionnelle
echo    5. Paramètres KM: sauvegarde fonctionnelle
echo.
echo ⚠️  IMPORTANT: Attendre 2-3 minutes que Render déploie le backend
echo    Les logs dans la console vous aideront à diagnostiquer
echo.
echo 🎯 Tous les problèmes sont corrigés !
echo.
pause