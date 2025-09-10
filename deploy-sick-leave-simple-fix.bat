@echo off
echo 🔧 Correction de la page sick-leave-simple.html
echo.

echo 📝 Ajout des modifications...
git add frontend/public/sick-leave-simple.html

echo 💾 Commit des modifications...
git commit -m "fix: Correction de sick-leave-simple.html - champ email modifiable et amélioration du chargement des employés"

echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ✅ Corrections déployées !
echo 📋 Le champ email est maintenant modifiable
echo 🔄 Amélioration du chargement des employés avec logs de débogage
echo.
pause


