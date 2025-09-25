@echo off
echo 🔧 Correction de la gestion de la réponse API dans sick-leave-simple.html
echo.

echo 📝 Ajout des modifications...
git add frontend/public/sick-leave-simple.html

echo 💾 Commit des modifications...
git commit -m "fix: Correction de la gestion de la réponse API dans sick-leave-simple.html - support des deux formats de réponse"

echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ✅ Correction déployée !
echo 📋 La page sick-leave-simple.html gère maintenant les deux formats de réponse API
echo 🔄 Les employés devraient maintenant s'afficher correctement dans la liste déroulante
echo.
pause


