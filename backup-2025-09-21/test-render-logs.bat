@echo off
echo ========================================
echo 🔍 VÉRIFICATION LOGS RENDER
echo ========================================
echo.

echo 🎯 TEST DE L'ENDPOINT D'ENVOI DE MOT DE PASSE :
echo.

echo 📋 Test avec un employé existant :
curl -X POST "https://boulangerie-planning-api-4-pbfy.onrender.com/api/auth/send-password/68b2e09d82eccfe63341f36b" -H "Content-Type: application/json"

echo.
echo.
echo 🔍 RECHERCHEZ DANS LA RÉPONSE :
echo   - "✅ Utilisation du template de la base de données"
echo   - "⚠️ Template non trouvé, utilisation du template par défaut"
echo.

echo ⚠️  SI VOUS VOYEZ "Template non trouvé" :
echo   Le nouveau code n'est pas encore actif
echo.

echo ✅ SI VOUS VOYEZ "Utilisation du template" :
echo   Le nouveau code est actif mais il y a un autre problème
echo.

pause




