@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND - DEBUG ABSENCES
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
if not exist "deploy-ovh-debug-absences" mkdir deploy-ovh-debug-absences
xcopy "frontend\build\*" "deploy-ovh-debug-absences\" /E /Y /Q

echo ✅ Fichiers copiés
echo.

echo 📝 Création du fichier .htaccess pour OVH...
echo # Configuration OVH pour React Router > deploy-ovh-debug-absences\.htaccess
echo RewriteEngine On >> deploy-ovh-debug-absences\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-ovh-debug-absences\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-ovh-debug-absences\.htaccess
echo RewriteRule . /index.html [L] >> deploy-ovh-debug-absences\.htaccess

echo ✅ Fichier .htaccess créé
echo.

echo 🚀 Frontend avec debug des absences prêt pour déploiement OVH !
echo.
echo 📂 Dossier de déploiement : deploy-ovh-debug-absences\
echo 📋 Contenu :
dir deploy-ovh-debug-absences /B
echo.
echo 🔧 MODIFICATIONS AJOUTÉES :
echo    ✅ Logs de débogage dans AbsenceStatusPage.js
echo    ✅ Logs de débogage dans AbsenceStatus.js
echo    ✅ Vérification de la structure des données employés
echo    ✅ Diagnostic des propriétés absences/sickLeaves/delays
echo.
echo 💡 UPLOAD MANUEL REQUIS :
echo    1. Connectez-vous à votre espace OVH
echo    2. Uploadez TOUS les fichiers du dossier deploy-ovh-debug-absences\
echo    3. Assurez-vous que .htaccess est bien présent
echo.
echo 🔍 APRÈS DÉPLOIEMENT :
echo    1. Ouvrez la console du navigateur (F12)
echo    2. Allez sur la page "État des absences"
echo    3. Regardez les logs dans la console
echo    4. Identifiez pourquoi les données sont à 0
echo.
echo ⚠️  ATTENTION : Ne pas oublier le fichier .htaccess !
echo.

pause

