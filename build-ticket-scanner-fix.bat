@echo off
echo 🎫 Construction du correctif scanner de tickets...

echo.
echo 📦 Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Construction terminée !
echo.
echo 🎯 Fonctionnalités ajoutées :
echo    - Extraction du montant depuis les vrais codes-barres
echo    - Support des codes-barres : 041222212300070028300005 (7€)
echo    - Support des codes-barres : 045906168640115220700005 (11,52€)
echo    - Simulation avec vrais codes-barres
echo    - Validation des montants (0.01€ - 50€)
echo.
echo 🧪 Test du bouton "Simuler scan" :
echo    - Le bouton utilise maintenant de vrais codes-barres
echo    - Extraction automatique du montant
echo    - Affichage des logs dans la console
echo.
echo 📋 Prochaines étapes :
echo    1. Tester le bouton "Simuler scan" dans l'interface
echo    2. Vérifier que les montants sont corrects (7€ ou 11,52€)
echo    3. Tester avec de vrais codes-barres si nécessaire
echo.
pause



