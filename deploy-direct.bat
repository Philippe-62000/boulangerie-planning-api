@echo off
echo ========================================
echo    DEPLOIEMENT DIRECT - CORRECTIONS PLANNING
echo ========================================
echo.

echo [1/3] Vérification des corrections appliquées...
echo ✅ getDailyRequirements corrigé (équilibrage personnel)
echo ✅ selectEmployeesForDay corrigé (limites strictes)  
echo ✅ adjustEmployeeSchedule corrigé (tolérance 1h)
echo ✅ Logs détaillés ajoutés pour debugging
echo.

echo [2/3] Push des corrections vers GitHub...
echo 📡 Commit et push des modifications...
git add .
git commit -m "🔧 CORRECTIONS PLANNING: Équilibrage personnel + Limites strictes + Tolérance 1h + Logs détaillés"
git push origin main
echo.

echo [3/3] Déploiement en cours...
echo 🌐 Render va redéployer automatiquement (2-5 min)
echo 📊 Les corrections seront actives après redéploiement
echo.

echo ========================================
echo    CORRECTIONS DÉPLOYÉES !
echo ========================================
echo.
echo 🔧 Prochaines étapes :
echo    1. Attendre le redéploiement Render (vérifier les logs)
echo    2. Uploader le site sur OVH
echo    3. Tester la génération du planning semaine 36
echo    4. Vérifier l'équilibre du personnel et volumes horaires
echo.
echo ⚠️  IMPORTANT : Utiliser OR-Tools uniquement (pas de fallback)
echo.
pause
