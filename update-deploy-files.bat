@echo off
echo ========================================
echo   MISE A JOUR DES FICHIERS DE DEPLOY
echo ========================================
echo.

echo 1. Suppression de l'ancien dossier...
if exist "deploy-frontend" rmdir /s /q "deploy-frontend"

echo 2. Création du nouveau dossier...
mkdir "deploy-frontend"

echo 3. Copie des fichiers HTML...
copy "frontend\public\*.html" "deploy-frontend\" /Y

echo 4. Copie des fichiers CSS...
xcopy "frontend\build\static\css\*" "deploy-frontend\static\css\" /E /I /Y

echo 5. Copie des fichiers JS...
xcopy "frontend\build\static\js\*" "deploy-frontend\static\js\" /E /I /Y

echo 6. Copie du fichier index.html...
copy "frontend\build\index.html" "deploy-frontend\" /Y

echo 7. Copie du fichier manifest.json...
if exist "frontend\build\manifest.json" copy "frontend\build\manifest.json" "deploy-frontend\" /Y

echo.
echo ========================================
echo   VERIFICATION DES NOUVELLES ROUTES
echo ========================================
echo.

echo Recherche de la route advance-requests dans le JS...
findstr /i "advance-requests" "deploy-frontend\static\js\*.js"
if %errorlevel% equ 0 (
    echo ✅ Route advance-requests trouvée dans le JS
) else (
    echo ❌ Route advance-requests NON trouvée dans le JS
)

echo.
echo ========================================
echo   FICHIERS PRETS POUR OVH
echo ========================================
echo.
echo Dossier: deploy-frontend\
echo.
dir "deploy-frontend" /B
echo.
echo ========================================
echo   INSTRUCTIONS
echo ========================================
echo.
echo 1. Uploadez TOUS les fichiers du dossier deploy-frontend\ vers OVH
echo 2. Remplacez les fichiers existants
echo 3. Testez: https://www.filmara.fr/plan/advance-requests
echo.
pause

