@echo off
echo 🔧 Forcer le redéploiement de Render...
echo.

echo 📝 Ajout d'un fichier de forçage...
echo "Force redeploy $(date)" > force-redeploy.txt

echo 📝 Commit de forçage...
git add force-redeploy.txt
git commit -m "Force: Forcer le redéploiement Render - routes auth désactivées"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ COMMIT DE FORÇAGE ENVOYÉ !
echo.
echo 📋 Instructions supplémentaires pour Render :
echo.
echo 1. 🌐 Allez sur https://dashboard.render.com
echo 2. 🔍 Sélectionnez "boulangerie-planning-api-4-pbfy"
echo 3. 🔄 Cliquez sur "Manual Deploy" > "Deploy latest commit"
echo 4. ⏳ Attendez que le déploiement se termine
echo.
echo 🎯 Le serveur devrait maintenant démarrer sans erreur !
echo.
echo ⚠️  Si le problème persiste :
echo    - Créez un nouveau service Render
echo    - Ou contactez le support Render
echo.
pause




