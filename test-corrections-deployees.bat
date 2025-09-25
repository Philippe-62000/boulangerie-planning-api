@echo off
echo ========================================
echo 🎯 TEST CORRECTIONS DÉPLOYÉES
echo ========================================
echo.

echo ✅ REDÉPLOIEMENT RÉUSSI !
echo   Commit : 30af4f0fe37e2693de4ea97fd1e55f276741ad55
echo   Service : https://boulangerie-planning-api-4-pbfy.onrender.com
echo.

echo 🧪 TEST 1 - ENDPOINT SEND PASSWORD :
curl -X POST "https://boulangerie-planning-api-4-pbfy.onrender.com/api/auth/send-password/68b2e09d82eccfe63341f36b" -H "Content-Type: application/json"

echo.
echo.
echo 🔍 RECHERCHEZ DANS LA RÉPONSE :
echo   ✅ "success": true = Endpoint fonctionne
echo   ✅ "Utilisation du template de la base de données" = Template BDD utilisé
echo   ❌ "Template non trouvé" = Problème avec le template
echo.

echo 🎯 SI TOUT FONCTIONNE :
echo   1. Allez dans l'interface admin
echo   2. Cliquez "🔐 Mot de passe" pour Camille
echo   3. Vérifiez l'email reçu (devrait être le beau template OVH)
echo   4. Testez la connexion avec le nouveau mot de passe
echo.

pause





