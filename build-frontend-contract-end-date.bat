@echo off
echo ========================================
echo   BUILD FRONTEND - CONTRACT END DATE
echo ========================================

echo.
echo 1. Build du frontend...
cd frontend
npm run build
cd ..

echo.
echo 2. Copie vers deploy/www...
xcopy frontend\build\* deploy\www\ /E /I /Y

echo.
echo ✅ SUCCÈS ! Frontend rebuild avec contractEndDate
echo 📁 Fichiers copiés vers deploy/www/
echo.
echo 3. Prochaines étapes :
echo    - Upload manuel vers OVH
echo    - Tester l'ajout de dates de fin de contrat pour les apprentis
echo    - Vérifier que "Générer Planning" fonctionne
echo.
pause





