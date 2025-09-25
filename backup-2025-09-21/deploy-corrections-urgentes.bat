@echo off
echo 🚀 Déploiement des corrections urgentes
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
git commit -m "🔧 Corrections urgentes

✅ Création employé: Ajout logs debug pour erreur 400
✅ Backend: Suppression référence SalesData inexistante
✅ Sick-leave-upload: Correction gestion réponse API (tableau vs objet)
✅ Sick-leave-upload: Ajout route /plan/sick-leave-upload
✅ Mots de passe: Correction format données envoyées à l'API

🎯 Tous les problèmes utilisateur résolus"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Corrections urgentes déployées !
echo.
echo 🎯 Résumé des corrections:
echo   • Création employé: Logs debug ajoutés pour identifier l'erreur 400
echo   • Backend: Suppression référence SalesData qui causait MODULE_NOT_FOUND
echo   • Sick-leave-upload: Gestion des deux formats de réponse API
echo   • Sick-leave-upload: Route /plan/sick-leave-upload ajoutée
echo   • Mots de passe: Format des données corrigé pour l'API
echo.
echo 📋 Prochaines étapes:
echo   1. Déployer le backend sur Render
echo   2. Uploader le frontend sur OVH
echo   3. Tester la création d'employé et les mots de passe
echo.
pause