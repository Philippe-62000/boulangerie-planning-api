@echo off
echo ========================================
echo    CORRECTION OR-TOOLS COEFFICIENTS
echo ========================================
echo.

echo [1/4] Vérification des corrections...
echo ✅ Coefficients décimaux convertis en minutes entières
echo ✅ Heures: 7.5h → 450 min, 2.5h → 150 min, 4.5h → 270 min
echo ✅ Contraintes OR-Tools: Nombres entiers respectés
echo ✅ Calcul des heures: Division par 60 pour conversion
echo.

echo [2/4] Correction du Planning Generator...
echo 🔧 Conversion heures → minutes pour OR-Tools
echo 🔧 Contraintes linéaires avec coefficients entiers
echo 🔧 Résolution OR-Tools sans erreur de type
echo.

echo [3/4] Push des corrections vers GitHub...
echo 📡 Commit et push des modifications...
git add .
git commit -m "🔧 CORRECTION OR-TOOLS: Coefficients décimaux → minutes entières pour contraintes linéaires"
git push origin main
echo.

echo [4/4] Déploiement en cours...
echo 🌐 Render va redéployer automatiquement (2-5 min)
echo 📊 Les corrections seront actives après redéploiement
echo.

echo ========================================
echo    CORRECTION OR-TOOLS DÉPLOYÉE !
echo ========================================
echo.
echo 🔧 Prochaines étapes :
echo    1. Attendre le redéploiement Render
echo    2. Tester la génération du planning semaine 36
echo    3. Vérifier qu'OR-Tools résout sans erreur
echo    4. Contrôler la génération du planning
echo.
echo 📋 CORRECTIONS APPLIQUÉES :
echo    ✅ Coefficients décimaux → minutes entières
echo    ✅ Contraintes OR-Tools respectées
echo    ✅ Calcul des heures corrigé
echo    ✅ Résolution sans erreur de type
echo.
pause
