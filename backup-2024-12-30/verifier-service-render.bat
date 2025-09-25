@echo off
echo ========================================
echo 🔍 VÉRIFICATION SERVICE RENDER
echo ========================================
echo.

echo 🎯 TEST DES DEUX SERVICES :
echo.

echo 📋 Service 3 (boulangerie-planning-api-3) :
curl -X GET "https://boulangerie-planning-api-3.onrender.com/api/employees" -H "Content-Type: application/json" --max-time 10

echo.
echo.
echo 📋 Service 4 (boulangerie-planning-api-4-pbfy) :
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/employees" -H "Content-Type: application/json" --max-time 10

echo.
echo.
echo 🔍 ANALYSE :
echo   - Si le service 3 répond : C'est le bon
echo   - Si le service 4 répond : C'est le bon
echo   - Si aucun ne répond : Problème de déploiement
echo.

echo ⚠️  IMPORTANT :
echo   Nos commits sont sur le service 4 (boulangerie-planning-api-4-pbfy)
echo   Mais le frontend pointe peut-être vers le service 3
echo.

pause
