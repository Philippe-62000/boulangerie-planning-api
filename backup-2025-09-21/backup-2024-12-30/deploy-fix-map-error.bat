@echo off
echo 🚀 Correction de l'erreur 'e.map is not a function'
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
echo 🔧 Ajout des fichiers au Git...
git add .
git commit -m "🔧 Correction erreur 'e.map is not a function'

✅ Correction de tous les composants qui utilisent l'API /employees
✅ Gestion des deux formats de réponse API (tableau direct ou {success, data})
✅ Composants corrigés: Employees, Tutors, Constraints, Dashboard, AbsenceStats, AbsenceModal
✅ Protection contre les erreurs de format de données
✅ Logs de debug ajoutés pour faciliter le dépannage

🎯 Le site devrait maintenant se charger correctement"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Correction déployée !
echo.
echo 🎯 Résumé des corrections:
echo   • Employees.js: Gestion des deux formats de réponse API
echo   • Tutors.js: Correction du chargement des employés
echo   • Constraints.js: Correction du chargement des employés
echo   • Dashboard.js: Correction du chargement des employés
echo   • AbsenceStats.js: Correction du chargement des employés
echo   • AbsenceModal.js: Correction du chargement des employés
echo   • Protection contre les erreurs de format
echo   • Logs de debug ajoutés
echo.
echo 📋 Prochaines étapes:
echo   1. Uploader le frontend sur OVH
echo   2. Tester que le site se charge correctement
echo   3. Vérifier que toutes les pages fonctionnent
echo.
echo 🔗 Le site devrait maintenant être accessible sans erreur
echo.
pause
