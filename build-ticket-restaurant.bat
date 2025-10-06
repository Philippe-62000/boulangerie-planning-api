@echo off
echo 🎫 Construction du système Ticket Restaurant...

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
echo ✅ Construction terminée avec succès !
echo.
echo 🚀 Le système Ticket Restaurant est prêt :
echo    - Menu ajouté dans la sidebar
echo    - Page de gestion des tickets créée
echo    - API backend configurée
echo    - Permissions configurées
echo.
echo 📋 Fonctionnalités disponibles :
echo    - Scanner de tickets (simulation)
echo    - Gestion par fournisseur (UP, Pluxee, Bimpli, Edenred)
echo    - Statistiques mensuelles
echo    - Suppression de tickets
echo    - Totaux automatiques
echo.
pause




