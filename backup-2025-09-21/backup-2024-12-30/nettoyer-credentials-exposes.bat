@echo off
echo ========================================
echo 🧹 NETTOYAGE CREDENTIALS EXPOSÉS
echo ========================================

echo.
echo 🎯 Problème: GitGuardian a détecté des credentials SMTP exposés
echo    Solution: Nettoyer les fichiers et supprimer les credentials
echo.

echo 📋 Étape 1: Suppression des fichiers de build...
echo.

echo 🗑️ Suppression des dossiers de build contenant des credentials...
if exist "frontend-ovh-sick-leave-fix" (
    echo Suppression de frontend-ovh-sick-leave-fix...
    rmdir /s /q "frontend-ovh-sick-leave-fix"
)

if exist "deploy-ovh-excel-fix" (
    echo Suppression de deploy-ovh-excel-fix...
    rmdir /s /q "deploy-ovh-excel-fix"
)

if exist "frontend-ovh-final" (
    echo Suppression de frontend-ovh-final...
    rmdir /s /q "frontend-ovh-final"
)

if exist "test-ovh" (
    echo Suppression de test-ovh...
    rmdir /s /q "test-ovh"
)

if exist "test-htaccess" (
    echo Suppression de test-htaccess...
    rmdir /s /q "test-htaccess"
)

echo.
echo 📋 Étape 2: Nettoyage des fichiers de documentation...
echo.

echo 🔧 Remplacement des emails réels par des exemples...
powershell -Command "(Get-Content 'TROUVER-APP-PASSWORDS.md') -replace 'philangenpdc@gmail.com', 'votre-email@gmail.com' | Set-Content 'TROUVER-APP-PASSWORDS.md'"
powershell -Command "(Get-Content 'verifier-configuration-email.bat') -replace 'philangenpdc@gmail.com', 'votre-email@gmail.com' | Set-Content 'verifier-configuration-email.bat'"

echo.
echo 📋 Étape 3: Création du .gitignore pour éviter les futures expositions...
echo.

echo 📝 Ajout des règles .gitignore...
echo # Fichiers de build avec credentials >> .gitignore
echo frontend-ovh-*/ >> .gitignore
echo deploy-ovh-*/ >> .gitignore
echo test-ovh/ >> .gitignore
echo test-htaccess/ >> .gitignore
echo *.env >> .gitignore
echo .env.* >> .gitignore

echo.
echo 📋 Étape 4: Commit et push des corrections...
git add .
git commit -m "🧹 Fix: Suppression credentials SMTP exposés - Nettoyage GitGuardian"
git push origin main

echo.
echo ✅ NETTOYAGE TERMINÉ !
echo.
echo 📋 Résumé des actions:
echo    ✅ Suppression des dossiers de build avec credentials
echo    ✅ Remplacement des emails réels par des exemples
echo    ✅ Ajout de règles .gitignore
echo    ✅ Push des corrections
echo.
echo 📋 Prochaines étapes:
echo    1. Attendre que Render redéploie
echo    2. Vérifier que GitGuardian ne détecte plus de credentials
echo    3. Configurer les variables SMTP sur Render
echo    4. Tester le service email
echo.
echo 🔗 Liens utiles:
echo    - GitGuardian: https://dashboard.gitguardian.com
echo    - Render Dashboard: https://dashboard.render.com
echo.

pause
