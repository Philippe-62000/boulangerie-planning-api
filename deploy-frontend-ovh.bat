@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND SUR OVH
echo ========================================
echo.

echo [1/5] Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
echo ✅ Construction terminée
echo.

echo [2/5] Copie des fichiers vers le dossier de déploiement...
cd ..
if not exist "deploy-ovh" mkdir deploy-ovh
xcopy /E /I /Y "frontend\build\*" "deploy-ovh\"
echo ✅ Fichiers copiés
echo.

echo [3/5] Copie des fichiers de configuration OVH...
copy /Y "frontend\public\.htaccess" "deploy-ovh\"
copy /Y "frontend\public\http-redirect.html" "deploy-ovh\"
echo ✅ Configuration OVH copiée
echo.

echo [4/5] Création de l'archive pour upload...
powershell -command "Compress-Archive -Path 'deploy-ovh\*' -DestinationPath 'frontend-ovh-deploy.zip' -Force"
echo ✅ Archive créée: frontend-ovh-deploy.zip
echo.

echo [5/5] Nettoyage...
rmdir /S /Q deploy-ovh
echo ✅ Nettoyage terminé
echo.

echo ========================================
echo DEPLOIEMENT FRONTEND TERMINE !
echo ========================================
echo.
echo 📁 Archive prête: frontend-ovh-deploy.zip
echo.
echo 📋 INSTRUCTIONS POUR OVH:
echo 1. Se connecter à votre espace OVH
echo 2. Aller dans "Fichiers" de votre hébergement
echo 3. Naviguer vers le dossier "www" ou "public_html"
echo 4. Supprimer les anciens fichiers (sauf .htaccess si personnalisé)
echo 5. Uploader et extraire frontend-ovh-deploy.zip
echo 6. Vérifier que .htaccess est bien présent
echo.
echo 🌐 URLs d'accès:
echo - Application: https://www.filmara.fr/plan/
echo - Arrêts maladie: https://www.filmara.fr/plan/sick-leave
echo - Gestion admin: https://www.filmara.fr/plan/sick-leave-management
echo.
echo ========================================
pause
