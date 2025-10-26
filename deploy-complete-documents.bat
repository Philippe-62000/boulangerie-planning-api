@echo off
echo 🚀 Déploiement complet du système de documents
echo.

echo 📁 Étape 1: Compilation du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la compilation
    pause
    exit /b 1
)
echo ✅ Frontend compilé avec succès
cd ..

echo.
echo 📁 Étape 2: Préparation des fichiers pour FileZilla...
echo.

echo 📋 Fichiers à uploader via FileZilla :
echo.
echo 1️⃣ CONTENU DE frontend/build/ → /plan/
echo    (Tous les fichiers compilés React)
echo.
echo 2️⃣ frontend/public/admin-documents.html → /plan/admin-documents.html
echo    (Interface d'administration des documents)
echo.

echo 🎯 URLs finales après déploiement :
echo - Application React : https://www.filmara.fr/plan/
echo - Interface Documents : https://www.filmara.fr/plan/admin-documents.html
echo - Page Parameters : https://www.filmara.fr/plan/parameters
echo.

echo 📁 Structure FileZilla :
echo /plan/
echo ├── static/ (dossier)
echo ├── index.html
echo ├── manifest.json
echo ├── admin-documents.html ← NOUVEAU
echo └── ... (autres fichiers compilés)
echo.

echo ✅ Prêt pour le déploiement FileZilla !
echo.
echo 🔧 Instructions FileZilla :
echo 1. Ouvrir FileZilla
echo 2. Se connecter au serveur OVH
echo 3. Naviguer vers /plan/
echo 4. Uploader TOUT le contenu de frontend/build/
echo 5. Uploader admin-documents.html vers /plan/admin-documents.html
echo.

pause

