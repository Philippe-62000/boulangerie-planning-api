@echo off
echo ========================================
echo    REMPLACEMENT DES FICHIERS ORIGINAUX
echo ========================================
echo.

echo [1/4] Vérification des fichiers patchés...
if not exist "frontend\src\pages\Constraints.js.patched" (
    echo ❌ Fichier Constraints.js.patched manquant
    pause
    exit /b 1
)
if not exist "frontend\src\pages\Planning.js.patched" (
    echo ❌ Fichier Planning.js.patched manquant
    pause
    exit /b 1
)
echo ✅ Fichiers patchés trouvés
echo.

echo [2/4] Vérification des sauvegardes...
if not exist "frontend\src\pages\Constraints.js.backup" (
    echo ❌ Fichier Constraints.js.backup manquant
    pause
    exit /b 1
)
if not exist "frontend\src\pages\Planning.js.backup" (
    echo ❌ Fichier Planning.js.backup manquant
    pause
    exit /b 1
)
echo ✅ Fichiers de sauvegarde trouvés
echo.

echo [3/4] Remplacement des fichiers originaux...
echo.

echo 📝 Remplacement de Constraints.js...
copy "frontend\src\pages\Constraints.js.patched" "frontend\src\pages\Constraints.js"
if %errorlevel% equ 0 (
    echo ✅ Constraints.js remplacé avec succès
) else (
    echo ❌ Erreur lors du remplacement de Constraints.js
    pause
    exit /b 1
)

echo 📝 Remplacement de Planning.js...
copy "frontend\src\pages\Planning.js.patched" "frontend\src\pages\Planning.js"
if %errorlevel% equ 0 (
    echo ✅ Planning.js remplacé avec succès
) else (
    echo ❌ Erreur lors du remplacement de Planning.js
    pause
    exit /b 1
)

echo.
echo [4/4] Nettoyage et finalisation...
echo.

echo 🗑️ Suppression des fichiers temporaires...
del "frontend\src\pages\Constraints.js.patched"
del "frontend\src\pages\Planning.js.patched"
echo ✅ Fichiers temporaires supprimés

echo.
echo 🎯 RÉSULTAT FINAL :
echo    ✅ Constraints.js - Bouton 6j/7 réactif visuellement
echo    ✅ Planning.js - Dates, couleurs des shifts, "MAL" en rouge
echo    ✅ Fichiers originaux mis à jour
echo    ✅ Sauvegardes conservées (.backup)
echo.
echo 🔧 Prochaines étapes :
echo    1. Tester le frontend
echo    2. Vérifier que les patches fonctionnent
echo    3. Si problème, restaurer depuis .backup
echo.
echo ========================================
echo    PATCHES APPLIQUÉS AVEC SUCCÈS !
echo ========================================
echo.
pause

