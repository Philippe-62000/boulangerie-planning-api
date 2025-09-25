@echo off
echo ========================================
echo 🔍 TEST SERVICE RENDER
echo ========================================
echo.

echo 🎯 VÉRIFICATION DU SERVICE :
echo.

echo 📋 Test endpoint basic :
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/employees" -H "Content-Type: application/json"

echo.
echo.
echo 🔍 RECHERCHEZ DANS LA RÉPONSE :
echo   - Si vous voyez des employés : Service OK
echo   - Si erreur : Service down ou en cours de déploiement
echo.

echo ⏳ SI LE SERVICE NE RÉPOND PAS :
echo   Render est en train de redéployer (peut prendre 5-10 minutes)
echo.

pause
