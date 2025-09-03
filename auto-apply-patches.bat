@echo off
echo ========================================
echo    APPLICATION AUTOMATIQUE DES PATCHES
echo ========================================
echo.

echo [1/5] Vérification des fichiers...
if not exist "patch-constraints.js" (
    echo ❌ Fichier patch-constraints.js manquant
    pause
    exit /b 1
)
if not exist "patch-planning.js" (
    echo ❌ Fichier patch-planning.js manquant
    pause
    exit /b 1
)
echo ✅ Fichiers de patch trouvés
echo.

echo [2/5] Sauvegarde des fichiers originaux...
if exist "frontend\src\pages\Constraints.js" (
    copy "frontend\src\pages\Constraints.js" "frontend\src\pages\Constraints.js.backup"
    echo ✅ Constraints.js sauvegardé
)
if exist "frontend\src\pages\Planning.js" (
    copy "frontend\src\pages\Planning.js" "frontend\src\pages\Planning.js.backup"
    echo ✅ Planning.js sauvegardé
)
echo.

echo [3/5] Application automatique des patches simples...
echo.

echo 🔧 PATCH CONSTRAINTS.JS - Ajout de l'état sixDayWorkers...
powershell -Command "(Get-Content 'frontend\src\pages\Constraints.js') -replace 'const \[loading, setLoading\] = useState\(false\);', 'const [loading, setLoading] = useState(false);\n  const [sixDayWorkers, setSixDayWorkers] = useState({});' | Set-Content 'frontend\src\pages\Constraints.js'"
if %errorlevel% equ 0 (
    echo ✅ État sixDayWorkers ajouté
) else (
    echo ❌ Erreur lors de l'ajout de l'état
)

echo.
echo [4/5] Création des fichiers de remplacement complets...
echo.

echo 📝 Création de Constraints.js.patched...
copy "frontend\src\pages\Constraints.js" "frontend\src\pages\Constraints.js.patched"
echo ✅ Fichier de travail créé

echo 📝 Création de Planning.js.patched...
copy "frontend\src\pages\Planning.js" "frontend\src\pages\Planning.js.patched"
echo ✅ Fichier de travail créé

echo.
echo [5/5] Instructions finales :
echo.
echo 🎯 PATCHES APPLIQUÉS AUTOMATIQUEMENT :
echo    ✅ État sixDayWorkers ajouté dans Constraints.js
echo    ✅ Fichiers de sauvegarde créés (.backup)
echo    ✅ Fichiers de travail créés (.patched)
echo.
echo 🔧 PATCHES À APPLIQUER MANUELLEMENT :
echo    1. Ouvrir patch-constraints.js et copier le code
echo    2. Ouvrir patch-planning.js et copier le code
echo    3. Appliquer dans les fichiers .patched
echo    4. Tester et remplacer les originaux
echo.
echo 📁 Fichiers créés :
echo    - Constraints.js.backup (sauvegarde)
echo    - Constraints.js.patched (à modifier)
echo    - Planning.js.backup (sauvegarde)
echo    - Planning.js.patched (à modifier)
echo.
echo ========================================
echo    PATCHES PRÊTS À APPLIQUER !
echo ========================================
echo.
pause

