@echo off
echo ========================================
echo TEST CORRECTIONS FINALES
echo ========================================

echo [1/4] Test santé API...
curl -s https://boulangerie-planning-api-3.onrender.com/health
echo.

echo [2/4] Test permissions menu admin...
curl -s "https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin"
echo.

echo [3/4] Test permissions menu employee...
curl -s "https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=employee"
echo.

echo [4/4] Test paramètres...
curl -s https://boulangerie-planning-api-3.onrender.com/api/parameters
echo.

echo ========================================
echo TESTS TERMINÉS
echo ========================================
echo.
echo Vérifiez que :
echo ✅ API répond (health)
echo ✅ Permissions admin incluent dashboard et constraints
echo ✅ Permissions employee incluent dashboard
echo ✅ Paramètres se chargent sans erreur
echo.
pause

