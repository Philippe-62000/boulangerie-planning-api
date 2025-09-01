@echo off
echo ========================================
echo Copie des fichiers build vers deploy/www
echo ========================================

echo.
echo 1. Suppression du dossier plan/ dans deploy/www...
if exist "deploy\www\plan" (
    rmdir /s /q "deploy\www\plan"
    echo   ✓ Dossier plan/ supprimé
) else (
    echo   - Dossier plan/ n'existait pas
)

echo.
echo 2. Suppression des fichiers de test dans deploy/www...
del /q "deploy\www\*.html" 2>nul
del /q "deploy\www\*.txt" 2>nul
echo   ✓ Fichiers de test supprimés

echo.
echo 3. Copie des fichiers du build vers deploy/www...
xcopy "frontend\build\*" "deploy\www\" /E /Y /Q
echo   ✓ Fichiers copiés

echo.
echo 4. Copie des fichiers de configuration...
copy "deploy\www\config.js" "deploy\www\config.js.bak" 2>nul
copy "deploy\www\.htaccess" "deploy\www\.htaccess.bak" 2>nul
copy "deploy\www\api-proxy.php" "deploy\www\api-proxy.php.bak" 2>nul

echo.
echo ========================================
echo ✅ Copie terminée avec succès !
echo ========================================
echo.
echo Prochaines étapes :
echo 1. Uploader TOUT le contenu de deploy/www/ vers /plan/ sur OVH
echo 2. Vider le cache du navigateur (Ctrl+Shift+R)
echo 3. Tester l'application
echo.
pause
