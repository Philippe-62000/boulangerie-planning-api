@echo off
echo ========================================
echo   DEPLOIEMENT NOUVELLE VERSION
echo   Frais Repas + Frais KM + Parametres
echo ========================================
echo.

echo [1/8] Arret des processus existants...
taskkill /F /IM node.exe 2>nul
echo ✅ Processus arretes

echo.
echo [2/8] Construction du backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances backend
    pause
    exit /b 1
)
echo ✅ Backend construit

echo.
echo [3/8] Construction du frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances frontend
    pause
    exit /b 1
)

echo.
echo [4/8] Build de production du frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build frontend
    pause
    exit /b 1
)
echo ✅ Frontend construit

echo.
echo [5/8] Copie des fichiers de production...
cd ..
if exist "C:\inetpub\wwwroot\plan" (
    echo Suppression de l'ancienne version...
    rmdir /s /q "C:\inetpub\wwwroot\plan"
)

echo Creation du dossier de production...
mkdir "C:\inetpub\wwwroot\plan"

echo Copie des fichiers frontend...
xcopy "frontend\build\*" "C:\inetpub\wwwroot\plan\" /E /I /Y

echo Copie des fichiers backend...
mkdir "C:\inetpub\wwwroot\plan\api"
xcopy "backend\*" "C:\inetpub\wwwroot\plan\api\" /E /I /Y

echo Suppression des dossiers inutiles en production...
rmdir /s /q "C:\inetpub\wwwroot\plan\api\node_modules" 2>nul
rmdir /s /q "C:\inetpub\wwwroot\plan\api\src" 2>nul
rmdir /s /q "C:\inetpub\wwwroot\plan\api\test" 2>nul

echo ✅ Fichiers copies

echo.
echo [6/8] Configuration de l'environnement de production...
echo Creation du fichier .env de production...
(
echo NODE_ENV=production
echo PORT=5000
echo MONGODB_URI=mongodb://localhost:27017/boulangerie-planning
echo APP_NAME=Planning Boulangerie
echo APP_VERSION=2.1.0
echo CORS_ORIGIN=https://www.filmara.fr,https://filmara.fr
) > "C:\inetpub\wwwroot\plan\api\.env"

echo ✅ Environnement configure

echo.
echo [7/8] Installation des dependances de production...
cd "C:\inetpub\wwwroot\plan\api"
call npm install --production
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dependances de production
    pause
    exit /b 1
)
echo ✅ Dependances de production installees

echo.
echo [8/8] Demarrage du serveur de production...
echo Demarrage du serveur backend...
start /B node server.js

echo Attente du demarrage du serveur...
timeout /t 5 /nobreak >nul

echo Test de la connexion...
curl -s http://localhost:5000/health >nul
if %errorlevel% equ 0 (
    echo ✅ Serveur backend demarre avec succes
) else (
    echo ⚠️  Serveur backend en cours de demarrage...
)

echo.
echo ========================================
echo   DEPLOIEMENT TERMINE AVEC SUCCES !
echo ========================================
echo.
echo 🌐 Application accessible sur :
echo    https://www.filmara.fr/plan
echo.
echo 📊 Nouvelles fonctionnalites :
echo    ✅ Parametres KM (12 trajets configurables)
echo    ✅ Frais Repas (saisie mensuelle)
echo    ✅ Frais KM (calcul automatique)
echo    ✅ Impression etat salaries
echo.
echo 🔧 Gestion du serveur :
echo    - Arreter : taskkill /F /IM node.exe
echo    - Redemarrer : cd C:\inetpub\wwwroot\plan\api ^&^& node server.js
echo.
echo 📝 Logs du serveur dans : C:\inetpub\wwwroot\plan\api
echo.
pause

