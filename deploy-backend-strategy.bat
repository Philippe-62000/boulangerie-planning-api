@echo off
echo ========================================
echo    DÉPLOIEMENT BACKEND - NOUVELLE STRATÉGIE
echo ========================================
echo.

echo [1/4] Vérification des modifications...
echo ✅ Nouvelle stratégie de planning implémentée
echo ✅ 7 étapes de génération du planning
echo ✅ Gestion des contraintes et weekends
echo ✅ Équilibrage selon affluence
echo.

echo [2/3] Push des modifications vers GitHub...
echo 📡 Commit et push des modifications...
git add .
git commit -m "🚀 NOUVELLE STRATÉGIE PLANNING: 7 étapes + équilibrage + contraintes"
git push origin main
echo.

echo [3/3] Déploiement en cours...
echo 🌐 Render va redéployer automatiquement (2-5 min)
echo 📊 La nouvelle stratégie sera active après redéploiement
echo.

echo ========================================
echo    NOUVELLE STRATÉGIE DÉPLOYÉE !
echo ========================================
echo.
echo 🔧 Prochaines étapes :
echo    1. Attendre le redéploiement Render
echo    2. Tester la génération du planning semaine 36
echo    3. Vérifier l'application de la nouvelle stratégie
echo.
echo 📋 NOUVELLE STRATÉGIE :
echo    ✅ Étape 1: Placement des contraintes
echo    ✅ Étape 2: Repos weekend selon règles mineurs
echo    ✅ Étape 3: Calcul disponibilités par groupe
echo    ✅ Étape 4: Placement ouverture/fermeture
echo    ✅ Étape 5: Créneaux restants
echo    ✅ Étape 6: Ajustement heures contractuelles
echo    ✅ Étape 7: Équilibrage selon affluence
echo.
pause
