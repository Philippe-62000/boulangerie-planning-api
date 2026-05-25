@echo off
echo ========================================
echo   Page Camaris - build pour Vercel
echo   (static + API serverless, sans Render)
echo ========================================
echo.

cd frontend
set VITE_CAMARIS_PUBLIC_URL=https://camaris-semaine.vercel.app
call npm run build:camaris-vercel
if %errorlevel% neq 0 (
    echo ERREUR build frontend
    exit /b 1
)
cd ..

echo Copie API serverless (camaris-vercel-api)...
if not exist deploy-camaris-vercel mkdir deploy-camaris-vercel
xcopy /E /I /Y camaris-vercel-api\api deploy-camaris-vercel\api >nul
xcopy /E /I /Y camaris-vercel-api\lib deploy-camaris-vercel\lib >nul
copy /Y camaris-vercel-api\package.json deploy-camaris-vercel\ >nul
copy /Y camaris-vercel-api\vercel.json deploy-camaris-vercel\ >nul

echo.
echo OK: dossier deploy-camaris-vercel\ pret (front + api/)
echo.
echo Deploiement Vercel (Root Directory: deploy-camaris-vercel):
echo   Variables obligatoires (memes valeurs que Render api-3):
echo     MONGODB_URI
echo     JWT_SECRET
echo.
echo   cd deploy-camaris-vercel ^&^& npx vercel --prod
echo.
