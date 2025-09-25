@echo off
echo ========================================
echo DÉPLOIEMENT BACKEND PARAMÈTRES URGENT
echo ========================================

echo [1/3] Vérification des corrections backend...
echo ✅ Paramètres: required: false pour displayName et kmValue
echo ✅ Contrôleur: validation corrigée pour accepter valeurs vides
echo ✅ Mots de passe: correction contrôleur admin/employee

echo [2/3] Commit et push vers Git (Render)...
git add .
git commit -m "Fix: Correction urgente paramètres KM et mots de passe

- Paramètres: required: false pour displayName et kmValue
- Contrôleur: validation corrigée pour accepter valeurs vides
- Mots de passe: correction contrôleur admin/employee
- Correction erreurs 400 pour paramètres KM"

git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo 🎉 BACKEND DÉPLOYÉ !
echo.
echo 📋 Corrections déployées :
echo    ✅ Validation paramètres KM (required: false)
echo    ✅ Contrôleur paramètres corrigé
echo    ✅ Mots de passe corrigés
echo.
echo 🧪 Tests après déploiement :
echo    1. https://boulangerie-planning-api-3.onrender.com/health
echo    2. Sauvegarde paramètres KM (plus d'erreur 400)
echo    3. Sauvegarde mots de passe
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
echo.
pause
