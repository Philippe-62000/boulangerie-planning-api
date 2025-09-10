@echo off
echo 🚀 Déploiement des corrections multiples
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
git commit -m "🔧 Corrections multiples

✅ Correction création employé - logs détaillés ajoutés
✅ Page standalone - titre corrigé 'Boulangerie Ange - Arras'
✅ Lien admin corrigé vers /plan/sick-leave-standalone.html
✅ Validation des données employé améliorée
✅ Conversion des types de données (age, weeklyHours)

🎯 Problèmes résolus:
• Erreur 400 création employé (logs détaillés)
• Titre page standalone corrigé
• URL page standalone corrigée
• Validation des données améliorée"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Corrections déployées !
echo.
echo 🎯 Résumé des corrections:
echo   • EmployeeModal.js: Logs détaillés et validation améliorée
echo   • sick-leave-standalone.html: Titre corrigé 'Boulangerie Ange - Arras'
echo   • SickLeaveAdmin.js: Lien corrigé vers /plan/sick-leave-standalone.html
echo   • Conversion des types de données (age, weeklyHours)
echo   • Validation des champs optionnels améliorée
echo.
echo 📋 Prochaines étapes:
echo   1. Uploader le frontend sur OVH
echo   2. Tester la création d'employé avec les nouveaux logs
echo   3. Vérifier la page standalone avec le bon titre
echo   4. Tester l'upload d'arrêt maladie
echo.
echo 🔗 URLs à tester:
echo   • Page standalone: /plan/sick-leave-standalone.html
echo   • Création employé: Vérifier les logs dans la console
echo.
pause
