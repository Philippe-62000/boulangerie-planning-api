@echo off
echo 🎫 Déploiement du correctif scanner de tickets...

echo.
echo 📦 Étape 1: Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 📦 Étape 2: Ajout des modifications au staging Git...
git add frontend/src/pages/TicketRestaurant.js
git add frontend/build/

echo ✅ Fichiers ajoutés au staging

echo.
echo 📦 Étape 3: Commit des modifications...
git commit -m "Fix: Extraction du montant depuis les vrais codes-barres

- Fonction extractAmountFromBarcode mise à jour
- Support des codes-barres réels (7€ et 11,52€)
- Simulation avec vrais codes-barres
- Validation des montants (0.01€ - 50€)
- Logs détaillés pour le debug"

echo ✅ Commit créé

echo.
echo 📦 Étape 4: Push vers le repository...
git push origin main

echo ✅ Modifications poussées sur Git

echo.
echo 🎯 ACTIONS À EFFECTUER SUR RENDER :
echo.
echo 1. 📁 Aller sur le dashboard Render
echo 2. 🔄 Attendre le déploiement automatique
echo 3. 📋 Vérifier les logs de déploiement
echo 4. 🧪 Tester le bouton "Simuler scan" dans l'interface
echo.
echo 📋 Fonctionnalités déployées :
echo    - Extraction du montant depuis les vrais codes-barres
echo    - Support des codes : 041222212300070028300005 (7€)
echo    - Support des codes : 045906168640115220700005 (11,52€)
echo    - Simulation avec vrais codes-barres
echo    - Validation des montants (0.01€ - 50€)
echo.
echo 🧪 Test du bouton "Simuler scan" :
echo    - Le bouton utilise maintenant de vrais codes-barres
echo    - Extraction automatique du montant
echo    - Affichage des logs dans la console
echo.
echo ⏳ Le déploiement sur Render va commencer automatiquement...
echo.
pause



