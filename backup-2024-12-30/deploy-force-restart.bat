@echo off
echo ========================================
echo FORCE RESTART RENDER
echo ========================================

echo [1/3] Force restart Render...
echo ✅ Ajout variable FORCE_RESTART pour forcer le redémarrage
echo ✅ Modification render.yaml

echo [2/3] Commit et push vers Git (Render)...
git add render.yaml
git commit -m "Force: Redémarrage Render pour appliquer les corrections"
git push origin main

echo [3/3] Attente du redémarrage Render...
echo ⏳ Le redémarrage sur Render peut prendre 3-5 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo ✅ FORCE RESTART DÉPLOYÉ !
echo.
echo 🔧 Action appliquée :
echo    ✅ Variable FORCE_RESTART ajoutée
echo    ✅ Render va redémarrer complètement
echo    ✅ Toutes les corrections seront appliquées
echo.
echo 🧪 Tests après redémarrage :
echo    1. https://boulangerie-planning-api-3.onrender.com/health
echo    2. node test-parametres-simple.js
echo    3. Sauvegarde paramètres KM dans l'interface
echo.
echo ⏳ Attendez 3-5 minutes puis testez !
pause
