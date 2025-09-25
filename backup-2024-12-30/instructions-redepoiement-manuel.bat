@echo off
echo ========================================
echo 🚀 REDÉPLOIEMENT MANUEL RENDER
echo ========================================
echo.

echo 🎯 OBJECTIF :
echo   Forcer le redéploiement pour avoir immédiatement nos corrections
echo   - Template email depuis la base de données
echo   - Préservation du mot de passe lors des mises à jour
echo   - Endpoint /api/auth/send-password/ fonctionnel
echo.

echo 📋 INSTRUCTIONS RENDER :
echo   1. Aller sur : https://dashboard.render.com
echo   2. Sélectionner le service : boulangerie-planning-api-4
echo   3. Cliquer sur "Manual Deploy"
echo   4. Choisir "Deploy latest commit"
echo   5. Attendre 2-3 minutes
echo.

echo ✅ APRÈS REDÉPLOIEMENT :
echo   - Tester l'endpoint : /api/auth/send-password/68b2e09d82eccfe63341f36b
echo   - Renvoyer le mot de passe à Camille
echo   - Vérifier le nouveau template dans l'email
echo.

echo 🔍 VÉRIFICATION :
echo   Dans les logs Render, vous devriez voir :
echo   "✅ Utilisation du template de la base de données"
echo.

echo 🎯 TEST FINAL :
echo   Email : phimjc@gmail.com (Camille)
echo   Le template devrait maintenant être le beau template OVH
echo   avec "VOS IDENTIFIANTS DE CONNEXION" et toutes les explications
echo.

pause
