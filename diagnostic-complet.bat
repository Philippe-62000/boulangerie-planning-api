@echo off
echo ========================================
echo   DIAGNOSTIC COMPLET DU PROJET
echo ========================================

echo.
echo 1. Verification de la base de donnees...
node check-database.js

echo.
echo 2. Test des endpoints API...
echo Test GET /api/employees...
curl -s https://boulangerie-planning-api.onrender.com/api/employees

echo.
echo Test GET /api/planning/35/2025...
curl -s https://boulangerie-planning-api.onrender.com/api/planning/35/2025

echo.
echo Test GET /api/constraints/35/2025...
curl -s https://boulangerie-planning-api.onrender.com/api/constraints/35/2025

echo.
echo 3. Verification des fichiers de configuration...
echo.
echo Frontend API URL:
findstr "REACT_APP_API_URL" frontend\package.json

echo.
echo Backend config:
type backend\config.js

echo.
echo 4. Test de l'application web...
echo URL: https://www.filmara.fr/plan/
echo.

pause
