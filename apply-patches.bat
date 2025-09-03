@echo off
echo ========================================
echo    APPLICATION DES PATCHES
echo ========================================
echo.

echo [1/4] Vérification des fichiers de patch...
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

echo [2/4] Sauvegarde des fichiers originaux...
if exist "frontend\src\pages\Constraints.js" (
    copy "frontend\src\pages\Constraints.js" "frontend\src\pages\Constraints.js.backup"
    echo ✅ Constraints.js sauvegardé
)
if exist "frontend\src\pages\Planning.js" (
    copy "frontend\src\pages\Planning.js" "frontend\src\pages\Planning.js.backup"
    echo ✅ Planning.js sauvegardé
)
echo.

echo [3/4] Application des patches...
echo.
echo 📝 PATCH CONSTRAINTS.JS :
echo    - Ajout de l'état sixDayWorkers
echo    - Amélioration de la fonction applySixDaysWork
echo    - Bouton 6j/7 réactif visuellement
echo.
echo 📝 PATCH PLANNING.JS :
echo    - Ajout des dates des jours
echo    - Couleurs des shifts (Ouverture/Fermeture/Standard)
echo    - "MAL" en rouge et gras
echo    - Total semaine / volume contractuel
echo.

echo [4/4] Instructions d'application manuelle :
echo.
echo 🔧 POUR CONSTRAINTS.JS :
echo    1. Ouvrir frontend\src\pages\Constraints.js
echo    2. Ajouter après la ligne 15 : const [sixDayWorkers, setSixDayWorkers] = useState({});
echo    3. Remplacer la fonction applySixDaysWork par celle du patch
echo    4. Modifier le bouton 6j/7 selon le patch
echo.
echo 🔧 POUR PLANNING.JS :
echo    1. Ouvrir frontend\src\pages\Planning.js
echo    2. Ajouter les 3 fonctions utilitaires après getWeekNumber
echo    3. Modifier l'en-tête du tableau pour les dates
echo    4. Améliorer l'affichage des shifts et contraintes
echo    5. Corriger la colonne total semaine
echo.
echo 📋 Fichiers de patch disponibles :
echo    - patch-constraints.js
echo    - patch-planning.js
echo.
echo ⚠️  ATTENTION : Appliquez les patches manuellement en copiant-collant
echo    le code des fichiers de patch dans les fichiers correspondants
echo.
echo ========================================
echo    PATCHES PRÊTS À APPLIQUER !
echo ========================================
echo.
pause

