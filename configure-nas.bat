@echo off
echo 🔧 Configuration du NAS pour le stockage des documents
echo.

echo 📋 Instructions pour configurer le NAS sur Render :
echo.
echo 1. Allez sur https://render.com
echo 2. Connectez-vous à votre compte
echo 3. Sélectionnez votre service : boulangerie-planning-api-4-pbfy
echo 4. Cliquez sur "Environment" dans le menu de gauche
echo 5. Ajoutez une nouvelle variable d'environnement :
echo.
echo    Key: NAS_BASE_PATH
echo    Value: /chemin/vers/votre/nas/uploads/documents
echo.
echo    Exemples de valeurs :
echo    - /mnt/nas/uploads/documents
echo    - \\nas-server\shared\uploads\documents
echo    - /volume1/uploads/documents (Synology)
echo.
echo 6. Sauvegardez la configuration
echo 7. Render redéploiera automatiquement
echo.
echo ⏳ Après le redéploiement, les nouveaux fichiers seront stockés sur le NAS
echo.
pause
