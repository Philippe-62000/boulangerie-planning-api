@echo off
echo ========================================
echo DEPLOIEMENT FRONTEND - FIX BUFFER SCANNER
echo ========================================
echo.

echo Etape 1: Build du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR lors du build!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Build termine avec succes!
echo ========================================
echo.
echo Les fichiers sont prets dans: frontend\build\
echo.
echo PROCHAINES ETAPES:
echo 1. Ouvrez FileZilla
echo 2. Connectez-vous a OVH (www.filmara.fr)
echo 3. Allez dans le dossier /www/plan/
echo 4. Uploadez TOUT le contenu de frontend\build\ vers /www/plan/
echo.
echo OU utilisez robocopy si le lecteur reseau est monte:
echo robocopy "C:\boulangerie-planning\frontend\build" "Z:\www\plan" /MIR
echo.
pause


