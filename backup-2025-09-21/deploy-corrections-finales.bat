@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT CORRECTIONS FINALES
echo ========================================
echo.

echo 📋 Corrections apportées :
echo    ✅ Suppression duplication "Configuration des Alertes Email"
echo    ✅ Ajout paramètre siteName au backend
echo    ✅ Correction titre dynamique dans sick-leave-standalone.html
echo    ✅ Masquage arrêts maladie après 8 jours
echo    ✅ Synchronisation automatique validation → déclaration
echo    ✅ Fix page "État des absences"
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 🧹 Nettoyage du build précédent...
if exist "build" (
    rmdir /s /q build
    echo    ✅ Ancien build supprimé
)

echo 🔨 Build de production...
npm run build

echo.
echo 📋 Vérification du build...
if exist "build\index.html" (
    echo    ✅ Build réussi - index.html créé
) else (
    echo    ❌ Erreur build - index.html manquant
    cd ..
    pause
    exit /b 1
)

echo.
echo 📁 Retour au dossier racine...
cd ..

echo.
echo ========================================
echo ✅ BUILD CORRECTIONS FINALES TERMINÉ !
echo ========================================
echo.
echo 📋 Fichiers générés dans frontend/build/ :
echo    - index.html (page principale)
echo    - static/css/main.xxx.css (styles)
echo    - static/js/main.xxx.js (JavaScript)
echo    - sick-leave-standalone.html (avec nom du site dynamique)
echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo 💡 Instructions de déploiement OVH :
echo    1. Copier TOUT le dossier "frontend\build\" sur OVH
echo    2. Remplacer le contenu existant de votre site
echo    3. Tester sur https://www.filmara.fr
echo.
echo 🎯 Corrections apportées :
echo    - ✅ Suppression duplication "Configuration des Alertes Email"
echo    - ✅ Ajout paramètre siteName au backend
echo    - ✅ Correction titre dynamique dans sick-leave-standalone.html
echo    - ✅ Masquage arrêts maladie après 8 jours
echo    - ✅ Synchronisation automatique validation → déclaration
echo    - ✅ Fix page "État des absences"
echo.
pause