@echo off
echo 🚀 Déploiement de la page standalone pour les arrêts maladie
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
git commit -m "🏥 Page standalone pour arrêts maladie

✅ Création de sick-leave-standalone.html
✅ Page HTML complète sans menu flottant
✅ Champ email cliquable et modifiable
✅ Interface moderne et responsive
✅ Gestion des erreurs améliorée
✅ Lien admin mis à jour vers la nouvelle page

🎯 Les salariés n'ont plus accès au menu principal"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Page standalone déployée !
echo.
echo 🎯 Résumé des améliorations:
echo   • Nouvelle page HTML standalone: sick-leave-standalone.html
echo   • Aucun menu flottant - accès sécurisé pour les salariés
echo   • Champ email entièrement cliquable et modifiable
echo   • Interface moderne avec validation en temps réel
echo   • Gestion d'erreurs améliorée
echo   • Lien admin mis à jour
echo.
echo 📋 Prochaines étapes:
echo   1. Uploader le frontend sur OVH
echo   2. Tester la nouvelle page standalone
echo   3. Vérifier que les salariés n'ont plus accès au menu
echo.
echo 🔗 URL de la nouvelle page: /sick-leave-standalone.html
echo.
pause
