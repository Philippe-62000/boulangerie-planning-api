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
git commit -m "🔧 Correction upload documents: gestion des accents dans les noms d'employés (Océane, Adélaïde, etc.)"

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
