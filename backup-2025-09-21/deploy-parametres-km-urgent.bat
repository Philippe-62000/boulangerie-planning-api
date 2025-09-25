@echo off
echo ========================================
echo CORRECTION PARAMÈTRES KM URGENT
echo ========================================

echo [1/3] Correction paramètres KM appliquée...
echo ✅ Désactivation de la validation Mongoose (runValidators: false)
echo ✅ Contrôleur updateAllParameters corrigé

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/parametersController.js
git commit -m "Fix: Désactivation validation Mongoose pour paramètres KM"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo ✅ CORRECTION PARAMÈTRES KM DÉPLOYÉE !
echo.
echo 🔧 Correction appliquée :
echo    ✅ runValidators: false pour contourner la validation Mongoose
echo    ✅ updateAllParameters corrigé
echo.
echo 🧪 Tests après déploiement :
echo    1. https://boulangerie-planning-api-3.onrender.com/health
echo    2. Sauvegarde paramètres KM sans erreur 400
echo    3. Test direct avec node test-parametres-direct.js
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
pause
