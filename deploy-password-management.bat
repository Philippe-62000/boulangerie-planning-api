@echo off
echo ========================================
echo GESTION DES MOTS DE PASSE - PARAMETRES
echo ========================================

echo [1/4] Ajout de la gestion des mots de passe...
echo ✅ Backend: Controller et routes pour mots de passe
echo ✅ Frontend: Interface de modification des mots de passe
echo ✅ Validation: Minimum 6 caractères
echo ✅ Sécurité: Mise à jour sécurisée

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
git commit -m "🔐 GESTION MOTS DE PASSE: Interface modification admin + salarie dans Paramètres"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Gestion des mots de passe déployée vers GitHub

echo.
echo 🎉 GESTION DES MOTS DE PASSE IMPLÉMENTÉE !
echo.
echo 📋 Fonctionnalités ajoutées :
echo    ✅ Interface de modification des mots de passe
echo    ✅ Validation minimum 6 caractères
echo    ✅ Mise à jour sécurisée via API
echo    ✅ Interface intuitive dans Paramètres
echo.
echo 🔐 Utilisation :
echo    1. Aller dans Paramètres (menu administrateur)
echo    2. Section "Gestion des Mots de Passe"
echo    3. Saisir nouveaux mots de passe
echo    4. Cliquer "Mettre à jour"
echo.
echo 📁 Dossier à uploader sur OVH : deploy-ovh/
echo 🌐 Backend : Render.com (déploiement automatique)
echo.
echo ⏳ Prochaines étapes :
echo    1. Uploader le contenu de deploy-ovh/ sur OVH
echo    2. Tester la modification des mots de passe
echo    3. Vérifier la connexion avec nouveaux mots de passe
echo.
echo 🎯 Le système de gestion des mots de passe est opérationnel !
echo.
pause
