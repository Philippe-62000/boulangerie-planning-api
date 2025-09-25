@echo off
echo 🔑 Instructions pour ajouter JWT_SECRET sur Render...
echo.

echo 📋 Étapes à suivre sur Render :
echo.
echo 1. 🌐 Allez sur https://dashboard.render.com
echo 2. 🔍 Sélectionnez le service "boulangerie-planning-api-4-pbfy"
echo 3. ⚙️ Cliquez sur "Environment" dans le menu de gauche
echo 4. ➕ Cliquez sur "Add Environment Variable"
echo 5. 📝 Ajoutez les variables suivantes :
echo.
echo    Variable: JWT_SECRET
echo    Valeur: votre-cle-secrete-jwt-super-secure-2024
echo.
echo    Variable: NODE_ENV
echo    Valeur: production
echo.
echo 6. 💾 Cliquez sur "Save Changes"
echo 7. 🔄 Cliquez sur "Manual Deploy" > "Deploy latest commit"
echo.
echo 📝 Ou ajoutez directement ces variables :
echo    JWT_SECRET=votre-cle-secrete-jwt-super-secure-2024
echo    NODE_ENV=production
echo.
echo ✅ Une fois ajoutées, les routes auth devraient fonctionner !
echo.
echo 🔄 Alternative : Je peux réactiver les routes auth et tester
echo.
pause
