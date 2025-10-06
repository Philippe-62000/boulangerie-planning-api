@echo off
echo 🚀 Déploiement rapide - Correction scanner
echo.

cd frontend
call npm run build
cd ..

echo 📁 Copie vers build...
xcopy "frontend\build\*" "build\" /E /I /Y

echo ✅ Prêt pour upload manuel vers OVH
echo 📁 Dossier build créé avec les corrections
echo.
pause
