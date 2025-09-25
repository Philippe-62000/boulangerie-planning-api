@echo off
echo 🔧 Ajout de logs de débogage pour SalesStats...
echo.

echo 📝 Corrections appliquées :
echo   - ✅ Logs ajoutés pour fetchEmployees
echo   - ✅ Logs ajoutés pour le rendu du tableau
echo   - ✅ Vérification si employees.length > 0
echo.

echo 📝 Commit des corrections...
git add frontend/src/pages/SalesStats.js
git commit -m "Debug: Ajouter logs pour diagnostiquer SalesStats tableau vide"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ LOGS DE DÉBOGAGE DÉPLOYÉS !
echo.
echo 🎯 Maintenant :
echo   1. 📦 Rebuild du frontend (npm run build)
echo   2. 📤 Upload sur OVH 
echo   3. 🧪 Tester la page Statistiques de vente
echo   4. 🔍 Vérifier les logs dans la console
echo.
echo ⚠️  Si le tableau ne s'affiche toujours pas :
echo    - Vérifier les logs console pour voir les données employés
echo    - Vérifier si l'API /employees retourne bien les données
echo.
pause


