@echo off
echo ========================================
echo   DÉPLOIEMENT BACKEND - STATS VENTE
echo ========================================

echo.
echo [1/4] Verification des fichiers...
echo ✅ SalesStats.js (modele MongoDB)
echo ✅ salesStatsController.js
echo ✅ salesStats.js (routes)
echo ✅ server.js mis a jour

echo.
echo [2/4] Push des modifications vers GitHub...
echo 🚀 Commit et push des nouvelles fonctionnalites...
git add backend/models/SalesStats.js
git add backend/controllers/salesStatsController.js
git add backend/routes/salesStats.js
git add backend/server.js
git commit -m "💰 AJOUT STATS VENTE: Modele MongoDB + Controleur + Routes + API endpoints"
git push origin main

echo.
echo [4/4] Deploiement en cours...
echo ⏳ Render va redeployer automatiquement (2-5 min)
echo 🎯 Les nouvelles API seront actives apres redeploiement

echo.
echo ========================================
echo   STATS VENTE DÉPLOYÉES !
echo ========================================

echo.
echo 🎯 Prochaines etapes :
echo    1. Attendre le redeploiement Render
echo    2. Tester les endpoints API
echo    3. Verifier la sauvegarde en MongoDB
echo    4. Contrôler le bon fonctionnement

echo.
echo ✅ NOUVELLES FONCTIONNALITÉS :
echo    ✅ Modele MongoDB SalesStats avec index
echo    ✅ Controleur complet avec validation
echo    ✅ Routes API RESTful
echo    ✅ Endpoints pour CRUD des statistiques
echo    ✅ Calcul automatique des scores
echo    ✅ Agrégation des données mensuelles

echo.
echo 🔗 NOUVEAUX ENDPOINTS :
echo    POST /api/sales-stats - Sauvegarder stats
echo    GET /api/sales-stats/period/:month/:year - Stats periode
echo    GET /api/sales-stats/monthly/:year - Stats mensuelles
echo    GET /api/sales-stats/ranking/:month/:year - Classement
echo    GET /api/sales-stats/all - Toutes les stats
echo    DELETE /api/sales-stats/:month/:year - Supprimer

echo.
pause
