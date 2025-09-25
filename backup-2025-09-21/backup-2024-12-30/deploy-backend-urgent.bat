@echo off
echo ========================================
echo DÉPLOIEMENT BACKEND URGENT
echo ========================================

echo [1/3] Vérification des corrections backend...
echo ✅ Paramètres: required: false pour displayName et kmValue
echo ✅ Site: création directe au lieu de méthode statique
echo ✅ Contrôleur paramètres: validation corrigée

echo [2/3] Commit et push vers Git (Render)...
git add .
git commit -m "Fix: Correction validation paramètres KM et API site

- Paramètres: required: false pour displayName et kmValue
- Site: création directe au lieu de méthode statique  
- Contrôleur paramètres: validation corrigée
- Correction erreurs 400 et 404"

git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo 🎉 BACKEND DÉPLOYÉ !
echo.
echo 📋 Corrections déployées :
echo    ✅ Validation paramètres KM (required: false)
echo    ✅ API site corrigée (création directe)
echo    ✅ Contrôleur paramètres corrigé
echo.
echo 🧪 Tests après déploiement :
echo    1. https://boulangerie-planning-api-3.onrender.com/health
echo    2. Sauvegarde paramètres KM (plus d'erreur 400)
echo    3. Sauvegarde site (plus d'erreur 404)
echo    4. Sauvegarde mots de passe
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
echo.
pause
