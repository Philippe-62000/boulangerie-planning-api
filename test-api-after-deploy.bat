@echo off
echo 🧪 Test de l'API après déploiement...

echo.
echo 🔧 Test 1: Vérification de la route GET...
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/ticket-restaurant?month=2025-09" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route GET non accessible
    echo ⚠️ Le backend n'a pas encore été redémarré sur Render
) else (
    echo ✅ Route GET fonctionne
)

echo.
echo 🔧 Test 2: Test d'ajout d'un ticket...
curl -X POST "https://boulangerie-planning-api-4-pbfy.onrender.com/api/ticket-restaurant" ^
  -H "Content-Type: application/json" ^
  -d "{\"provider\":\"up\",\"amount\":10.50,\"date\":\"2025-09-15\",\"month\":\"2025-09\",\"barcode\":\"TEST123\"}" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route POST non accessible
    echo ⚠️ Le backend n'a pas encore été redémarré sur Render
) else (
    echo ✅ Route POST fonctionne
)

echo.
echo 🔧 Test 3: Test des statistiques...
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/ticket-restaurant/stats/2025-09" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route stats non accessible
    echo ⚠️ Le backend n'a pas encore été redémarré sur Render
) else (
    echo ✅ Route stats fonctionne
)

echo.
echo 📋 Résumé des tests :
echo    - Si toutes les routes fonctionnent : ✅ API prête
echo    - Si des routes échouent : ❌ Redémarrer le backend sur Render
echo.
echo 🎯 Prochaines étapes :
echo    1. Si API fonctionne : Tester le bouton "Simuler scan"
echo    2. Si API ne fonctionne pas : Redémarrer le backend sur Render
echo.
echo 📋 Pour redémarrer le backend sur Render :
echo    1. Aller sur le dashboard Render
echo    2. Sélectionner le service backend
echo    3. Cliquer sur "Restart" ou "Redeploy"
echo    4. Attendre que le déploiement se termine
echo    5. Relancer ce test
echo.
pause



