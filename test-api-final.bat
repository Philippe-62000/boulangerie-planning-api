@echo off
echo 🧪 Test final de l'API Ticket Restaurant...

echo.
echo 🔧 Test 1: Vérification de la route GET...
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/ticket-restaurant?month=2025-01" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route GET non accessible
) else (
    echo ✅ Route GET fonctionne
)

echo.
echo 🔧 Test 2: Test d'ajout d'un ticket...
curl -X POST "https://boulangerie-planning-api-4-pbfy.onrender.com/api/ticket-restaurant" ^
  -H "Content-Type: application/json" ^
  -d "{\"provider\":\"up\",\"amount\":10.50,\"date\":\"2025-01-15\",\"month\":\"2025-01\",\"barcode\":\"TEST123\"}" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route POST non accessible
) else (
    echo ✅ Route POST fonctionne
)

echo.
echo 🔧 Test 3: Test des statistiques...
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/ticket-restaurant/stats/2025-01" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route stats non accessible
) else (
    echo ✅ Route stats fonctionne
)

echo.
echo 🔧 Test 4: Test de la route delays...
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/delays" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Route delays non accessible
) else (
    echo ✅ Route delays fonctionne
)

echo.
echo 📋 Résumé des tests :
echo    - Si toutes les routes fonctionnent : ✅ API prête
echo    - Si des routes échouent : ❌ Redéployer le backend
echo.
echo 🎯 Prochaines étapes :
echo    1. Si API fonctionne : Tester le bouton "Simuler scan"
echo    2. Si API ne fonctionne pas : Redéployer le backend
echo.
echo 🧪 Test du bouton "Simuler scan" :
echo    - Le bouton génère un code-barres simulé
echo    - Extrait un montant aléatoire (5-15€)
echo    - Envoie les données à l'API
echo    - Affiche les statistiques en temps réel
echo.
echo 🎯 Appuyez sur une touche pour fermer...
pause



