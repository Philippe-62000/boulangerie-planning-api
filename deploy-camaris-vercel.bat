@echo off
echo ========================================
echo   Page Camaris - build pour Vercel
echo   (URL dediee clients, sans filmara.fr)
echo ========================================
echo.

cd frontend
set VITE_API_URL=https://boulangerie-planning-api-3.onrender.com/api
set VITE_CAMARIS_PUBLIC_URL=https://camaris-semaine.vercel.app
call npm run build:camaris-vercel
if %errorlevel% neq 0 (
    echo ERREUR build
    exit /b 1
)
cd ..

copy /Y deploy-camaris-vercel\vercel.json deploy-camaris-vercel\vercel.json >nul 2>&1
echo.
echo OK: dossier deploy-camaris-vercel\ pret
echo.
echo Deploiement Vercel:
echo   1. vercel.com - New Project - import repo ou CLI
echo   2. Root Directory: deploy-camaris-vercel
echo   3. Ou: cd deploy-camaris-vercel ^&^& vercel --prod
echo   4. Render api-3: variable CAMARIS_PUBLIC_ORIGIN = votre URL Vercel exacte
echo.
