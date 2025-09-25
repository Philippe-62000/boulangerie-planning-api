@echo off
echo 🔄 Mise à jour de l'URL de l'API vers le nouveau service Render...
echo.

echo 📝 Mise à jour des fichiers de configuration...

REM Mise à jour du service API principal
powershell -Command "(Get-Content 'frontend\src\services\api.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\services\api.js'"

REM Mise à jour du package.json
powershell -Command "(Get-Content 'frontend\package.json') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\package.json'"

REM Mise à jour des pages React
powershell -Command "(Get-Content 'frontend\src\pages\SickLeaveAdmin.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\pages\SickLeaveAdmin.js'"
powershell -Command "(Get-Content 'frontend\src\pages\SickLeaveUploadStandalone.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\pages\SickLeaveUploadStandalone.js'"
powershell -Command "(Get-Content 'frontend\src\pages\SickLeaveUpload.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\pages\SickLeaveUpload.js'"
powershell -Command "(Get-Content 'frontend\src\pages\SickLeaveManagement.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\pages\SickLeaveManagement.js'"
powershell -Command "(Get-Content 'frontend\src\pages\SalesStats.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\pages\SalesStats.js'"
powershell -Command "(Get-Content 'frontend\src\components\Sidebar.js') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\src\components\Sidebar.js'"

REM Mise à jour des pages HTML standalone
powershell -Command "(Get-Content 'frontend\public\sick-leave-standalone.html') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\public\sick-leave-standalone.html'"
powershell -Command "(Get-Content 'frontend\public\sick-leave-simple.html') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\public\sick-leave-simple.html'"
powershell -Command "(Get-Content 'frontend\public\vacation-request-standalone.html') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\public\vacation-request-standalone.html'"
powershell -Command "(Get-Content 'frontend\public\employee-dashboard.html') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\public\employee-dashboard.html'"
powershell -Command "(Get-Content 'frontend\public\salarie-connexion.html') -replace 'boulangerie-planning-api-3.onrender.com', 'boulangerie-planning-api-4-pbfy.onrender.com' | Set-Content 'frontend\public\salarie-connexion.html'"

echo ✅ Mise à jour terminée !
echo.
echo 🚀 Nouvelles URLs configurées :
echo    - API: https://boulangerie-planning-api-4-pbfy.onrender.com/api
echo.
echo 📋 Prochaines étapes :
echo    1. Configurer les variables d'environnement SMTP sur Render
echo    2. Rebuild et déployer le frontend
echo    3. Tester la nouvelle configuration
echo.
pause
