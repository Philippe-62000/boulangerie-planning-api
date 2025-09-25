@echo off
echo ========================================
echo 🔍 TEST CORS API RENDER
echo ========================================
echo.

echo 🌐 API URL : https://boulangerie-planning-api-4.onrender.com/api
echo 📍 Origine : https://www.filmara.fr
echo.

echo 🔧 TESTS CORS :
echo.

echo 1️⃣ Test de base (health check) :
curl -X GET "https://boulangerie-planning-api-4.onrender.com/api/health" -H "Origin: https://www.filmara.fr" -v
echo.
echo.

echo 2️⃣ Test OPTIONS (preflight) :
curl -X OPTIONS "https://boulangerie-planning-api-4.onrender.com/api/employees/login" -H "Origin: https://www.filmara.fr" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -v
echo.
echo.

echo 3️⃣ Test endpoint spécifique :
curl -X GET "https://boulangerie-planning-api-4.onrender.com/api/employees" -H "Origin: https://www.filmara.fr" -v
echo.
echo.

echo ❓ DIAGNOSTIC :
echo   Si vous voyez "Access-Control-Allow-Origin: https://www.filmara.fr" dans les réponses, CORS fonctionne
echo   Si vous voyez des erreurs 500/503, le service est peut-être endormi
echo   Si pas de headers CORS, vérifier la config Render
echo.
pause






