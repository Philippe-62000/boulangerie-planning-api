@echo off
echo 🔧 Ajout de la permission pour "Gestion des Arrêts Maladie"
echo.

echo 📝 Ajout des modifications...
git add backend/models/MenuPermissions.js

echo 💾 Commit des modifications...
git commit -m "fix: Ajout de la permission pour 'sick-leave-management' dans les permissions par défaut"

echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ✅ Permission ajoutée !
echo 📋 La permission pour "Gestion des Arrêts Maladie" a été ajoutée aux permissions par défaut.
echo 🔄 Le serveur va automatiquement recréer les permissions au prochain redémarrage.
echo.
pause


