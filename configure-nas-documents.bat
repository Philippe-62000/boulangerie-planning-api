@echo off
echo 🔧 Configuration du NAS pour les documents (même config que les arrêts maladie)
echo.

echo 📋 Variables d'environnement à configurer sur Render :
echo.
echo 1. Allez sur https://render.com
echo 2. Sélectionnez votre service : boulangerie-planning-api-4-pbfy
echo 3. Cliquez sur "Environment"
echo 4. Ajoutez/modifiez ces variables :
echo.
echo    NAS_BASE_PATH = /uploads/documents
echo    SFTP_PASSWORD = [déjà configuré pour les arrêts maladie]
echo.
echo 📁 Structure sur le NAS :
echo    /n8n/
echo    ├── sick-leaves/          (arrêts maladie - déjà configuré)
echo    └── uploads/
echo        └── documents/
echo            ├── general/      (documents généraux)
echo            └── personal/     (documents personnels)
echo.
echo ✅ Avantages :
echo    - Même NAS que les arrêts maladie
echo    - Même sécurité SFTP
echo    - Sauvegarde centralisée
echo    - Pas de duplication de configuration
echo.
echo ⏳ Après configuration, les nouveaux documents seront stockés sur le NAS
echo.
pause
