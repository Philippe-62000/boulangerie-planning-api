@echo off
echo 🔧 Correction du chemin NAS pour éviter les erreurs de permissions
echo.

echo 📋 Le problème :
echo    - Chemin absolu /uploads/documents = Permission denied
echo    - Chemin relatif uploads/documents = Fonctionne
echo.

echo 🚀 Solution sur Render :
echo    1. Allez sur https://render.com
echo    2. Sélectionnez votre service : boulangerie-planning-api-4-pbfy
echo    3. Cliquez sur "Environment"
echo    4. Modifiez la variable NAS_BASE_PATH :
echo.
echo    AVANT: NAS_BASE_PATH = /uploads/documents
echo    APRÈS: NAS_BASE_PATH = uploads/documents
echo.
echo 📁 Structure finale sur le NAS :
echo    /n8n/
echo    ├── sick-leaves/          (arrêts maladie)
echo    └── uploads/
echo        └── documents/
echo            ├── general/      (documents généraux)
echo            └── personal/     (documents personnels)
echo.
echo ✅ Avantages :
echo    - Pas d'erreur de permissions
echo    - Utilise le répertoire de base du SFTP
echo    - Même structure que les arrêts maladie
echo.
pause
