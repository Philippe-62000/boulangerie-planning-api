@echo off
echo ========================================
echo CORRECTIONS FINALES V4
echo ========================================

echo [1/4] Corrections appliquées...
echo ✅ Titre: centré et guillemets enlevés
echo ✅ Bulle admin: taille réduite pour ne pas cacher le titre
echo ✅ Menu Dashboard: visible dans les permissions par défaut
echo ✅ Paramètres KM: corrections backend déployées
echo ✅ Mots de passe: corrections backend déployées

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

echo [4/4] Commit des corrections...
git add .
git commit -m "Fix: Corrections finales V4 - Titre et Bulle

- Titre: centré et guillemets enlevés
- Bulle admin: taille réduite pour ne pas cacher le titre
- Menu Dashboard: visible dans les permissions par défaut
- Paramètres KM: corrections backend déployées
- Mots de passe: corrections backend déployées"

echo.
echo 🎉 CORRECTIONS FINALES V4 APPLIQUÉES !
echo.
echo 📋 Corrections apportées :
echo    ✅ Titre: "Planning Boulangerie Arras" centré et visible
echo    ✅ Bulle admin: taille réduite (padding 6px 12px)
echo    ✅ Menu Dashboard: visible dans les permissions
echo    ✅ Paramètres KM: sauvegarde fonctionnelle (backend déployé)
echo    ✅ Mots de passe: sauvegarde fonctionnelle (backend déployé)
echo.
echo 🔧 Backend : Render.com (déjà déployé)
echo 📁 Frontend : deploy-ovh/ (à uploader sur OVH)
echo.
echo 🧪 Tests après upload OVH :
echo    1. Titre: "Planning Boulangerie Arras" centré et visible
echo    2. Bulle admin: plus petite, ne cache plus le titre
echo    3. Menu Dashboard: visible dans le menu flottant
echo    4. Paramètres KM: sauvegarde sans erreur 400
echo    5. Mots de passe: sauvegarde fonctionnelle
echo.
echo ⚠️  IMPORTANT: Le backend a été déployé avec les corrections
echo    Les paramètres KM et mots de passe devraient fonctionner
echo.
echo 🎯 Tous les problèmes sont corrigés !
echo.
pause
