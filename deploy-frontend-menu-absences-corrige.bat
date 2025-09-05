@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND - MENU ABSENCES CORRIGE
echo ========================================
echo.

echo 📁 Changement vers le dossier frontend...
cd frontend

echo 🔧 Construction du frontend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)

echo ✅ Frontend construit avec succès
echo.

echo 📁 Retour au dossier racine...
cd ..

echo 📁 Copie des fichiers vers le dossier de déploiement...
if not exist "deploy-ovh-absences-corrige" mkdir deploy-ovh-absences-corrige
xcopy "frontend\build\*" "deploy-ovh-absences-corrige\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-absences-corrige\.htaccess
echo RewriteEngine On >> deploy-ovh-absences-corrige\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-absences-corrige\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-absences-corrige\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-absences-corrige\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend avec menu absences corrigé prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh-absences-corrige\
echo 📋 Contenu :
dir deploy-ovh-absences-corrige /B
echo.
echo 🔧 CORRECTION IMPLÉMENTÉE :
echo    ✅ Menu "État des absences" maintenant fonctionnel
echo    ✅ Chemin corrigé : /absence-status → /absences
echo    ✅ Synchronisation entre Sidebar et App.js
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Uploadez TOUS les fichiers du dossier deploy-ovh-absences-corrige\
echo    3. Assurez-vous que .htaccess est bien présent
echo.
echo ⚠️  ATTENTION : Ne pas oublier le fichier .htaccess !
echo.

pause

