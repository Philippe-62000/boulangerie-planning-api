@echo off
echo 🧪 Test des corrections d'upload
echo.

echo 📁 Vérification des fichiers...
if exist "frontend\public\admin-documents.html" (
    echo ✅ admin-documents.html trouvé
) else (
    echo ❌ admin-documents.html manquant
    pause
    exit /b 1
)

if exist "backend\controllers\documentController.js" (
    echo ✅ documentController.js trouvé
) else (
    echo ❌ documentController.js manquant
    pause
    exit /b 1
)

if exist "backend\scripts\create-uploads-dir.js" (
    echo ✅ create-uploads-dir.js trouvé
) else (
    echo ❌ create-uploads-dir.js manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Corrections apportées :
echo ✅ Champ file maintenant focusable (position: absolute, opacity: 0)
echo ✅ Gestion d'erreur pour le déplacement de fichiers
echo ✅ Création automatique des dossiers uploads
echo ✅ Support drag & drop
echo ✅ Affichage des fichiers sélectionnés
echo.

echo 📋 Prochaines étapes :
echo 1. Déployer admin-documents.html via FileZilla
echo 2. Le backend créera automatiquement les dossiers uploads
echo 3. Tester l'upload d'un document
echo.

echo 🎯 URL de test : https://www.filmara.fr/plan/admin-documents.html
echo.

pause

