@echo off
echo ========================================
echo Nettoyage du dossier deploy/www
echo ========================================

echo.
echo 1. Suppression des fichiers de test...
del /q "deploy\www\test-*.php" 2>nul
del /q "deploy\www\test-*.html" 2>nul
del /q "deploy\www\debug-*.html" 2>nul
del /q "deploy\www\analyze-*.html" 2>nul
del /q "deploy\www\check-*.html" 2>nul
del /q "deploy\www\quick-*.html" 2>nul
del /q "deploy\www\simple-*.html" 2>nul
del /q "deploy\www\mongodb-*.html" 2>nul
del /q "deploy\www\index-*.html" 2>nul
echo   ✓ Fichiers de test supprimés

echo.
echo 2. Suppression des fichiers .htaccess de test...
del /q "deploy\www\.htaccess-*" 2>nul
echo   ✓ Fichiers .htaccess de test supprimés

echo.
echo 3. Suppression des fichiers de sauvegarde...
del /q "deploy\www\*.bak" 2>nul
del /q "deploy\www\*.txt" 2>nul
echo   ✓ Fichiers de sauvegarde supprimés

echo.
echo 4. Suppression des fichiers proxy PHP (plus nécessaires)...
del /q "deploy\www\api-proxy*.php" 2>nul
echo   ✓ Fichiers proxy PHP supprimés

echo.
echo 5. Suppression du README (optionnel)...
del /q "deploy\www\README.md" 2>nul
echo   ✓ README supprimé

echo.
echo ========================================
echo ✅ Nettoyage terminé avec succès !
echo ========================================
echo.
echo Fichiers conservés :
echo - index.html
echo - .htaccess
echo - config.js
echo - static/ (dossier)
echo - asset-manifest.json
echo - manifest.json
echo.
pause
