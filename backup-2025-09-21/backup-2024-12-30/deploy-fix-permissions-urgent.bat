@echo off
echo ========================================
echo CORRECTION PERMISSIONS URGENT
echo ========================================

echo [1/3] Corrections appliquées...
echo ✅ Permissions: initialisation automatique au démarrage
echo ✅ Paramètres KM: corrections déjà déployées
echo ✅ Mots de passe: corrections déjà déployées

echo [2/3] Commit et push vers Git (Render)...
git add .
git commit -m "Fix: Correction permissions menu urgent

- Permissions: initialisation automatique au démarrage
- Vérification et création des permissions par défaut
- Correction menus manquants (Dashboard, Contraintes)"

git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health

echo.
echo 🎉 CORRECTIONS PERMISSIONS DÉPLOYÉES !
echo.
echo 📋 Corrections déployées :
echo    ✅ Permissions: initialisation automatique
echo    ✅ Paramètres KM: corrections déjà déployées
echo    ✅ Mots de passe: corrections déjà déployées
echo.
echo 🧪 Tests après déploiement :
echo    1. https://boulangerie-planning-api-3.onrender.com/health
echo    2. Menus Dashboard et Contraintes visibles
echo    3. Sauvegarde paramètres KM (plus d'erreur 400)
echo    4. Sauvegarde mots de passe
echo.
echo ⏳ Attendez 2-3 minutes puis testez !
echo.
pause
