@echo off
echo ========================================
echo DÉPLOIEMENT FRONTEND - CORRECTIONS FINALES
echo ========================================

echo [1/3] Build du frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)

echo [2/3] Préparation des fichiers...
cd ..
echo ✅ Build terminé dans frontend/build/

echo [3/3] Instructions de déploiement OVH...
echo.
echo 📁 Fichiers à uploader sur OVH :
echo    - Tout le contenu du dossier frontend/build/
echo    - Vers le répertoire /plan/ sur votre hébergement OVH
echo.
echo 🔧 Corrections incluses :
echo    ✅ Bulle admin réduite (titre plus visible)
echo    ✅ Titre centré
echo    ✅ Menus Dashboard et Contraintes corrigés
echo    ✅ Paramètres KM corrigés
echo    ✅ Mots de passe corrigés
echo.
echo 🎯 Après upload, testez :
echo    1. Menus Dashboard et Contraintes visibles
echo    2. Sauvegarde paramètres KM (plus d'erreur 400)
echo    3. Sauvegarde mots de passe
echo    4. Titre centré et bulle admin plus petite
echo.
echo ⚠️  IMPORTANT : Le backend a déjà été déployé sur Render
echo    avec toutes les corrections !
echo.
pause

