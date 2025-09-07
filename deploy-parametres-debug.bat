@echo off
echo ========================================
echo DÉPLOIEMENT PARAMÈTRES DEBUG
echo ========================================

echo [1/3] Ajout de logs de debug...
echo ✅ Logs détaillés ajoutés au contrôleur paramètres

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/parametersController.js
git commit -m "Debug: Logs détaillés pour paramètres KM"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo ✅ DÉPLOIEMENT DEBUG TERMINÉ !
echo.
echo 🔧 Logs ajoutés :
echo    ✅ Traitement détaillé de chaque paramètre
echo    ✅ Types et valeurs des champs
echo    ✅ Debug complet de la mise à jour
echo.
echo 🧪 Test après déploiement :
echo    node test-parametres-valid-id.js
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
pause
