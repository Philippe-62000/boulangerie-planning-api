@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT CORRECTIONS COMPLÈTES
echo ========================================
echo.

echo 📋 Vérification des fichiers modifiés...
echo.

echo ✅ Dashboard.js - Masquage arrêts maladie après 8 jours
if exist "frontend\src\pages\Dashboard.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ Employees.js - Masquage arrêts maladie après 8 jours
if exist "frontend\src\pages\Employees.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ AbsenceStatus.js - Fix page État des absences
if exist "frontend\src\components\AbsenceStatus.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ SickLeaveAdmin.js - Synchronisation automatique
if exist "frontend\src\pages\SickLeaveAdmin.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Build du frontend avec toutes les corrections...
echo.

echo 📁 Navigation vers le dossier frontend...
cd frontend

echo 🧹 Nettoyage du build précédent...
if exist "build" (
    rmdir /s /q build
    echo    ✅ Ancien build supprimé
) else (
    echo    ℹ️ Aucun build précédent trouvé
)

echo 📦 Installation des dépendances...
npm install

echo 🔨 Build de production...
npm run build

echo.
echo 📋 Vérification du nouveau build...
if exist "build\index.html" (
    echo    ✅ Build réussi - index.html créé
) else (
    echo    ❌ Erreur build - index.html manquant
    cd ..
    pause
    exit /b 1
)

echo.
echo 📊 Taille du nouveau dossier build...
for /f "tokens=3" %%a in ('dir build /s /-c ^| find "File(s)"') do echo    📦 Taille totale: %%a octets

echo.
echo 📁 Retour au dossier racine...
cd ..

echo.
echo ========================================
echo ✅ BUILD CORRECTIONS COMPLÈTES TERMINÉ !
echo ========================================
echo.
echo 📋 Fichiers générés dans frontend/build/ :
echo    - index.html (page principale)
echo    - static/css/main.xxx.css (styles avec corrections)
echo    - static/js/main.xxx.js (JavaScript avec corrections)
echo    - Autres fichiers de configuration
echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo 💡 Instructions de déploiement OVH :
echo    1. Copier TOUT le dossier "frontend\build\" sur OVH
echo    2. Remplacer le contenu existant de votre site
echo    3. Tester sur https://www.filmara.fr
echo.
echo 🎯 Corrections apportées :
echo    - ✅ Masquage arrêts maladie après 8 jours (Tableau de bord)
echo    - ✅ Masquage arrêts maladie après 8 jours (Gestion des salariés)
echo    - ✅ Fix page "État des absences" avec gestion d'erreur
echo    - ✅ Synchronisation automatique validation → déclaration manuelle
echo    - ✅ Amélioration de la logique de calcul des statistiques
echo.
pause