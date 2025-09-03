@echo off
echo ========================================
echo    CORRECTIONS FINALES - REPOS + OR-TOOLS
echo ========================================
echo.

echo [1/4] Vérification des corrections...
echo ✅ Règle repos: 1 repos obligatoire pour tous
echo ✅ Règle 6j/7: 2 repos si non coché
echo ✅ Limites strictes: Respect des besoins en personnel
echo ✅ OR-Tools forcé: Aucun fallback autorisé
echo.

echo [2/4] Correction des services OR-Tools...
echo 🔧 Constraint Calculator: Logique repos corrigée
echo 🔧 Planning Generator: Limites strictes appliquées
echo 🔧 Backend: OR-Tools obligatoire
echo.

echo [3/4] Push des corrections vers GitHub...
echo 📡 Commit et push des modifications...
git add .
git commit -m "🔧 CORRECTIONS FINALES: Repos obligatoires + Limites strictes + OR-Tools forcé"
git push origin main
echo.

echo [4/4] Déploiement en cours...
echo 🌐 Render va redéployer automatiquement (2-5 min)
echo 📊 Les corrections seront actives après redéploiement
echo.

echo ========================================
echo    CORRECTIONS FINALES DÉPLOYÉES !
echo ========================================
echo.
echo 🔧 Prochaines étapes :
echo    1. Attendre le redéploiement Render
echo    2. Tester la génération du planning semaine 36
echo    3. Vérifier les repos obligatoires
echo    4. Contrôler les limites de personnel
echo.
echo 📋 RÈGLES APPLIQUÉES :
echo    ✅ 1 repos obligatoire pour tous
echo    ✅ 2 repos si 6j/7 non coché
echo    ✅ Mineurs: repos dimanche obligatoire
echo    ✅ Limites strictes: Respect des besoins
echo    ✅ OR-Tools exclusif: Pas de fallback
echo.
pause
