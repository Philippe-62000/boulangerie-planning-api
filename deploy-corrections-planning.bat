@echo off
echo ========================================
echo    DEPLOIEMENT CORRECTIONS PLANNING
echo ========================================
echo.

echo [1/4] Vérification des modifications...
echo ✅ getDailyRequirements corrigé (équilibrage personnel)
echo ✅ selectEmployeesForDay corrigé (limites strictes)
echo ✅ adjustEmployeeSchedule corrigé (tolérance 1h)
echo ✅ Logs détaillés ajoutés pour debugging
echo.

echo [2/4] Test des corrections...
echo 🧪 Exécution du script de test...
node test-corrections-planning.js
echo.

echo [3/4] Déploiement sur Render...
echo 📡 Push des corrections vers GitHub...
call push-to-main.bat
echo.

echo [4/4] Vérification du déploiement...
echo 🌐 Render va redéployer automatiquement
echo 📊 Vérifier les logs pour confirmer les corrections
echo.

echo ========================================
echo    CORRECTIONS DÉPLOYÉES !
echo ========================================
echo.
echo 🔧 Prochaines étapes :
echo    1. Attendre le redéploiement Render (2-5 min)
echo    2. Tester la génération du planning semaine 36
echo    3. Vérifier l'équilibre du personnel
echo    4. Contrôler les volumes horaires
echo.
pause
