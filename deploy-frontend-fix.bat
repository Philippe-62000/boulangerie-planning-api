@echo off
echo 🚀 Déploiement du frontend avec correction envoi mot de passe...
echo.

echo 📦 Build du frontend...
cd frontend
call npm run build

echo.
echo 📁 Vérification du build...
if not exist "build" (
    echo ❌ Erreur: Dossier build non créé
    pause
    exit /b 1
)

echo ✅ Build créé avec succès

echo.
echo 📋 Contenu à déployer sur OVH :
echo   - 🗂️  Copier tout le contenu de frontend/build/
echo   - 🌐 Vers le dossier /plan/ sur OVH
echo   - ✅ Écraser les fichiers existants
echo.
echo 🎯 Après déploiement :
echo   - L'URL /employees/send-password/ sera utilisée
echo   - Plus d'erreur 404 pour l'envoi de mot de passe
echo.

cd ..
echo 📝 Création de l'archive de déploiement...
powershell -Command "Compress-Archive -Path 'frontend/build/*' -DestinationPath 'frontend-deploy.zip' -Force"

echo.
echo ✅ Archive créée : frontend-deploy.zip
echo.
echo 📋 ÉTAPES MANUELLES :
echo.
echo 1. 📁 Ouvrir le gestionnaire de fichiers OVH
echo 2. 🌐 Aller dans le dossier /plan/
echo 3. 📤 Uploader et extraire frontend-deploy.zip
echo 4. 🔄 Remplacer tous les fichiers
echo 5. 🧪 Tester l'envoi de mot de passe
echo.
pause


