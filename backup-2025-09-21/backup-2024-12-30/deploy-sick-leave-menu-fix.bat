@echo off
echo 🔧 Correction du menu "Gestion des Arrêts Maladie"
echo.

echo 📝 Ajout des modifications...
git add frontend/src/components/Sidebar.js

echo 💾 Commit des modifications...
git commit -m "fix: Correction du menu 'Gestion des Arrêts Maladie' - suppression de la duplication"

echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ✅ Correction du menu déployée !
echo 📋 Le menu "Gestion des Arrêts Maladie" devrait maintenant apparaître correctement pour les administrateurs.
echo.
pause


