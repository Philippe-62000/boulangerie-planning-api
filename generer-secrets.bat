@echo off
echo ========================================
echo   GENERATION DE NOUVEAUX SECRETS
echo ========================================
echo.

echo [1/3] Generation JWT_SECRET pour Arras...
powershell -Command "$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_}); Write-Host $secret"
echo.
echo Copiez le secret ci-dessus pour JWT_SECRET Arras
echo.

echo [2/3] Generation JWT_SECRET pour Longuenesse...
powershell -Command "$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_}); Write-Host $secret"
echo.
echo Copiez le secret ci-dessus pour JWT_SECRET Longuenesse
echo.

echo [3/3] Generation mot de passe MongoDB (12 caracteres)...
powershell -Command "$password = -join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 12 | ForEach-Object {[char]$_}); Write-Host $password"
echo.
echo Copiez le mot de passe ci-dessus pour MongoDB
echo.

echo ========================================
echo   INSTRUCTIONS
echo ========================================
echo.
echo 1. Copiez les secrets generes ci-dessus
echo 2. Suivez le guide : GUIDE-GENERATION-SECRETS-RENDER.md
echo 3. Mettez a jour les variables dans Render
echo 4. Redemarrez les services
echo.
pause







