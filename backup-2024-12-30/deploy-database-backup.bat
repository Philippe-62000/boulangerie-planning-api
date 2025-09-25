@echo off
echo 🗄️ Déploiement des fonctionnalités de sauvegarde de base de données
echo.

echo 📝 Ajout des modifications...
git add backend/controllers/databaseController.js
git add backend/routes/database.js
git add backend/server.js
git add frontend/src/pages/Parameters.js
git add frontend/src/pages/Parameters.css

echo 💾 Commit des modifications...
git commit -m "feat: Ajout des fonctionnalités d'export/import de la base de données MongoDB

- Nouveau contrôleur databaseController.js pour gérer les sauvegardes
- Routes /api/database/export, /api/database/import, /api/database/stats
- Interface utilisateur dans la page Paramètres
- Export complet de toutes les collections MongoDB
- Import avec remplacement complet des données
- Statistiques de la base de données en temps réel
- Interface sécurisée avec avertissements"

echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ✅ Fonctionnalités de sauvegarde déployées !
echo 🗄️ Nouvelles fonctionnalités disponibles dans Paramètres :
echo   - Export complet de la base de données
echo   - Import avec restauration complète
echo   - Statistiques en temps réel
echo   - Interface sécurisée avec avertissements
echo.
pause


