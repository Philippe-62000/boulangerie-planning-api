@echo off
echo 🎫 Poussée des fichiers ticket-restaurant sur Git...

echo.
echo 🔍 Vérification des fichiers locaux...
if not exist "backend\models\TicketRestaurant.js" (
    echo ❌ Fichier TicketRestaurant.js manquant
    pause
    exit /b 1
)
if not exist "backend\routes\ticketRestaurant.js" (
    echo ❌ Fichier ticketRestaurant.js manquant
    pause
    exit /b 1
)
if not exist "frontend\src\pages\TicketRestaurant.js" (
    echo ❌ Fichier TicketRestaurant.js frontend manquant
    pause
    exit /b 1
)

echo ✅ Tous les fichiers locaux sont présents

echo.
echo 🔧 Étape 1: Ajout des fichiers au staging...
git add backend\models\TicketRestaurant.js
git add backend\routes\ticketRestaurant.js
git add frontend\src\pages\TicketRestaurant.js
git add frontend\src\pages\TicketRestaurant.css

echo ✅ Fichiers ajoutés au staging

echo.
echo 🔧 Étape 2: Commit des fichiers...
git commit -m "Feat: Ajout système de gestion des tickets restaurant

- Ajout modèle TicketRestaurant avec validation
- Routes /api/ticket-restaurant pour CRUD complet
- Page TicketRestaurant avec scanner simulé
- Interface utilisateur complète avec statistiques
- Gestion par fournisseur (UP, Pluxee, Bimpli, Edenred)
- Totaux automatiques et historique des tickets
- Intégration dans le menu sidebar"

echo ✅ Commit créé

echo.
echo 🔧 Étape 3: Push vers le repository...
git push origin main

echo ✅ Fichiers poussés sur Git

echo.
echo 🎯 ACTIONS À EFFECTUER SUR RENDER :
echo.
echo 1. 📁 Aller sur le dashboard Render
echo 2. 🔄 Redémarrer le service backend
echo 3. 📋 Vérifier les logs de déploiement
echo 4. 🧪 Tester l'API avec : test-ticket-api-after-deploy.bat
echo.
echo 📋 Nouvelles routes déployées :
echo    - /api/ticket-restaurant (GET, POST, DELETE)
echo    - /api/ticket-restaurant/stats/:month
echo.
echo 🧪 Test du bouton "Simuler scan" :
echo    - Le bouton génère un code-barres simulé
echo    - Extrait un montant aléatoire (5-15€)
echo    - Envoie les données à l'API
echo    - Affiche les statistiques en temps réel
echo.
echo 🎯 Appuyez sur une touche pour fermer...
pause



