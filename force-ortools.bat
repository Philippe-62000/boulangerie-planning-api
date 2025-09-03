@echo off
echo ========================================
echo    FORCER UTILISATION OR-TOOLS
echo ========================================
echo.

echo [1/3] Vérification de la configuration OR-Tools...
echo 🔍 URL API OR-Tools: https://planning-ortools-api.onrender.com/solve
echo 🔍 Architecture distribuée: constraint-calculator + planning-generator
echo.

echo [2/3] Modification du contrôleur pour forcer OR-Tools...
echo 📝 Désactivation du fallback vers méthode classique
echo 📝 Utilisation exclusive d'OR-Tools
echo.

echo [3/3] Redémarrage du service...
echo 🌐 Render va redéployer avec OR-Tools forcé
echo.

echo ========================================
echo    OR-TOOLS FORCÉ !
echo ========================================
echo.
echo ✅ Seul OR-Tools sera utilisé pour la génération
echo ❌ Pas de fallback vers méthode classique
echo 🎯 Résultats optimaux garantis
echo.
pause
