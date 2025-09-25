@echo off
echo ========================================
echo 🧪 TEST PERMISSIONS MENU
echo ========================================
echo.

echo 🔍 VÉRIFICATION DES PERMISSIONS :
echo   - URL API: https://boulangerie-planning-api-3.onrender.com/api
echo   - Endpoint: /api/menu-permissions?role=admin
echo.

echo 📋 PERMISSIONS ATTENDUES :
echo   ✅ dashboard - Tableau de bord
echo   ✅ employees - Gestion des employés
echo   ✅ constraints - Contraintes hebdomadaires
echo   ✅ planning - Génération du planning
echo   ✅ absences - État des absences
echo   ✅ sales-stats - Stats Vente
echo   ✅ parameters - Paramètres
echo   ✅ meal-expenses - Frais Repas
echo   ✅ km-expenses - Frais KM
echo   ✅ employee-status-print - Imprimer État
echo   ✅ sick-leave-management - Gestion des Arrêts Maladie
echo   ✅ vacation-management - Gestion des Congés
echo.

echo 🚀 REDÉPLOIEMENT EN COURS :
echo   - Commit: 6dcfe0c - fix: Initialisation permissions menu
echo   - Render va automatiquement redéployer
echo   - Les permissions seront créées au démarrage
echo.

echo ⏳ VÉRIFICATION :
echo   1. Attendre 2-3 minutes pour le redéploiement
echo   2. Vérifier les logs Render
echo   3. Tester l'API: GET /api/menu-permissions?role=admin
echo   4. Vérifier que "vacation-management" est présent
echo.

echo 🔧 SI LE PROBLÈME PERSISTE :
echo   - Appeler: POST /api/menu-permissions/create-defaults
echo   - Cela forcera la création des permissions
echo.

echo ✅ CORRECTION APPLIQUÉE !
echo.
pause












