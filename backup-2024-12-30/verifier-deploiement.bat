@echo off
echo ========================================
echo   VERIFICATION POST-DEPLOIEMENT
echo ========================================
echo.

echo [1/6] Test de la connexion backend...
curl -s http://localhost:5000/health >nul
if %errorlevel% equ 0 (
    echo ✅ Backend accessible
) else (
    echo ❌ Backend inaccessible
    echo Demarrage du backend...
    cd "C:\inetpub\wwwroot\plan\api"
    start /B node server.js
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/6] Test de l'API des employes...
curl -s http://localhost:5000/api/employees >nul
if %errorlevel% equ 0 (
    echo ✅ API Employes fonctionnelle
) else (
    echo ❌ API Employes en erreur
)

echo.
echo [3/6] Test de l'API des parametres...
curl -s http://localhost:5000/api/parameters >nul
if %errorlevel% equ 0 (
    echo ✅ API Parametres fonctionnelle
) else (
    echo ❌ API Parametres en erreur
)

echo.
echo [4/6] Test de l'API des frais repas...
curl -s "http://localhost:5000/api/meal-expenses?month=9&year=2024" >nul
if %errorlevel% equ 0 (
    echo ✅ API Frais Repas fonctionnelle
) else (
    echo ❌ API Frais Repas en erreur
)

echo.
echo [5/6] Test de l'API des frais KM...
curl -s "http://localhost:5000/api/km-expenses?month=9&year=2024" >nul
if %errorlevel% equ 0 (
    echo ✅ API Frais KM fonctionnelle
) else (
    echo ❌ API Frais KM en erreur
)

echo.
echo [6/6] Test de l'API etat des salaries...
curl -s "http://localhost:5000/api/employee-status?month=9&year=2024" >nul
if %errorlevel% equ 0 (
    echo ✅ API Etat Salaries fonctionnelle
) else (
    echo ❌ API Etat Salaries en erreur
)

echo.
echo ========================================
echo   VERIFICATION TERMINEE
echo ========================================
echo.
echo 🌐 Application : https://www.filmara.fr/plan
echo.
echo 📊 Fonctionnalites disponibles :
echo    - Parametres KM (12 trajets)
echo    - Frais Repas (saisie mensuelle)
echo    - Frais KM (calcul automatique)
echo    - Impression etat salaries
echo.
pause

