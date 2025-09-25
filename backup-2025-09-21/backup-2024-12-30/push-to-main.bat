@echo off
echo ========================================
echo    PUSH VERS LA BRANCHE MAIN
echo ========================================
echo.

echo 🔍 Vérification du statut Git...
git status

echo.
echo 📦 Ajout de tous les fichiers modifiés...
git add .

echo.
echo 💾 Commit des modifications...
git commit -m "🔧 Ajout de l'ajustement automatique des heures contractuelles après génération OR-Tools"

echo.
echo 🚀 Push vers la branche main...
git push origin main

echo.
echo ✅ Push terminé !
echo.
echo 🌐 Vérifiez le déploiement sur Render.com
echo 📱 Testez le nouveau design sur votre site
echo.
pause
