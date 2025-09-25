@echo off
echo ========================================
echo 🔍 TEST TEMPLATE BASE DE DONNÉES
echo ========================================
echo.

echo 🎯 VÉRIFICATION :
echo   Le template est-il présent dans la base de données ?
echo   Nom recherché : 'employee_password'
echo.

echo 📋 CURL TEST - Récupération des templates :
curl -X GET "https://boulangerie-planning-api-4-pbfy.onrender.com/api/email-templates" -H "Content-Type: application/json"

echo.
echo.
echo 🔍 Recherchez dans la réponse :
echo   - Un template avec "name": "employee_password"
echo   - Son contenu doit contenir "VOS IDENTIFIANTS DE CONNEXION"
echo.

echo ⚠️  SI LE TEMPLATE N'EXISTE PAS :
echo   Le système utilisera le template par défaut (ancien)
echo.

pause




