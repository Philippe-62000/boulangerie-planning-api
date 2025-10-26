@echo off
echo 🔧 Configuration finale du NAS pour les documents
echo.

echo 📋 Solution définitive :
echo    - Utiliser le même répertoire de base que les arrêts maladie
echo    - Chemin complet : /n8n/uploads/documents
echo.

echo 🚀 Configuration sur Render :
echo    1. Allez sur https://render.com
echo    2. Sélectionnez votre service : boulangerie-planning-api-4-pbfy
echo    3. Cliquez sur "Environment"
echo    4. Modifiez la variable NAS_BASE_PATH :
echo.
echo    NAS_BASE_PATH = /n8n/uploads/documents
echo.
echo 📁 Structure finale sur le NAS :
echo    /n8n/
echo    ├── sick-leaves/          (arrêts maladie - déjà configuré)
echo    └── uploads/
echo        └── documents/
echo            ├── general/      (documents généraux)
echo            └── personal/     (documents personnels)
echo.
echo ✅ Avantages :
echo    - Même répertoire de base que les arrêts maladie
echo    - Pas d'erreur de permissions
echo    - Structure organisée
echo.
echo ⏳ Après configuration, les documents seront stockés dans /n8n/uploads/documents/
echo.
pause
