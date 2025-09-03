@echo off
echo ========================================
echo   DÉPLOIEMENT FRONTEND - STATS VENTE
echo ========================================

echo.
echo [1/4] Verification des fichiers...
echo ✅ SalesStats.js cree
echo ✅ SalesStats.css cree
echo ✅ Sidebar.js mis a jour
echo ✅ App.js mis a jour

echo.
echo [2/4] Build du frontend...
echo 🏗️ Construction de l'application React...
cd frontend
npm run build

echo.
echo [3/4] Preparation pour OVH...
echo 📁 Dossier build prepare
echo 🚀 Pret pour upload sur OVH

echo.
echo [4/4] Deploiement termine !
echo 🎯 Prochaines etapes :
echo    1. Upload du dossier 'build' sur OVH
echo    2. Tester le menu "Stats Vente"
echo    3. Verifier la saisie des donnees
echo    4. Contrôler le classement des vendeuses

echo.
echo ✅ FONCTIONNALITÉS AJOUTÉES :
echo    ✅ Menu "Stats Vente" dans la sidebar
echo    ✅ Page de saisie des donnees mensuelles
echo    ✅ Classement separe des vendeuses et responsables
echo    ✅ Comparaison sur 12 mois
echo    ✅ Calcul automatique des scores
echo    ✅ Interface responsive et moderne

echo.
echo 💰 FORMULE DE SCORE :
echo    CA Net HT + (Cartes Fid × 500) + (Avis + × 100) - (Avis - × 300)

echo.
pause
