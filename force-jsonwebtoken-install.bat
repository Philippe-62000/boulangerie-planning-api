@echo off
echo 🔧 Forcer l'installation de jsonwebtoken sur Render...
echo.

echo 📝 Commit pour forcer la réinstallation des dépendances...
git add .
git commit -m "Fix: Force jsonwebtoken installation - add explicit dependency check"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo 📋 Instructions pour Render :
echo    1. Allez sur votre dashboard Render
echo    2. Sélectionnez le service boulangerie-planning-api-4-pbfy
echo    3. Cliquez sur "Manual Deploy" > "Deploy latest commit"
echo    4. Ou cliquez sur "Settings" > "Environment" > "Add Environment Variable"
echo    5. Ajoutez : FORCE_RESTART=true
echo    6. Puis redéployez
echo.
echo 🔄 Alternative : Créer un nouveau service Render si le problème persiste
echo.
echo ✅ Commit effectué pour forcer la réinstallation !
echo.
pause
