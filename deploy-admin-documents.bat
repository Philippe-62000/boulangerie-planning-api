@echo off
echo 🚀 Déploiement de l'interface d'administration des documents
echo.

REM Vérifier que le fichier existe
if not exist "frontend\public\admin-documents.html" (
    echo ❌ Fichier admin-documents.html non trouvé
    pause
    exit /b 1
)

echo ✅ Fichier admin-documents.html trouvé
echo.

REM Copier le fichier vers le dossier de déploiement
echo 📁 Copie du fichier...
copy "frontend\public\admin-documents.html" "deploy\admin-documents.html"

if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la copie
    pause
    exit /b 1
)

echo ✅ Fichier copié avec succès
echo.

echo 📋 Instructions de déploiement :
echo 1. Ouvrir FileZilla
echo 2. Se connecter au serveur OVH
echo 3. Naviguer vers le dossier /plan/
echo 4. Uploader le fichier deploy\admin-documents.html
echo 5. Le renommer en admin-documents.html sur le serveur
echo.

echo 🎯 URL finale : https://www.filmara.fr/plan/admin-documents.html
echo.

echo ✅ Déploiement préparé ! Vous pouvez maintenant uploader via FileZilla.
pause

