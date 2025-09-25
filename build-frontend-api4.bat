@echo off
echo ========================================
echo 🔧 BUILD FRONTEND - NOUVELLE API v4
echo ========================================
echo.

echo 🎯 OBJECTIF :
echo   - Pointer vers la nouvelle API : boulangerie-planning-api-4.onrender.com
echo   - Reconstruire les fichiers JS avec la bonne URL
echo   - Mettre à jour frontend-ovh/ avec les nouveaux fichiers
echo.

echo 🔄 ÉTAPES :
echo   1. Build du frontend React
echo   2. Copie des fichiers vers frontend-ovh/
echo   3. Mise à jour des fichiers standalone HTML
echo.

cd frontend
echo ⏳ Construction du frontend en cours...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build réussi !
    echo.
    echo 📁 Copie vers frontend-ovh/...
    cd ..
    
    REM Nettoyer le dossier de destination (sauf les fichiers HTML standalone)
    if exist "frontend-ovh\static" rmdir /s /q "frontend-ovh\static"
    if exist "frontend-ovh\asset-manifest.json" del "frontend-ovh\asset-manifest.json"
    if exist "frontend-ovh\index.html" del "frontend-ovh\index.html"
    if exist "frontend-ovh\manifest.json" del "frontend-ovh\manifest.json"
    
    REM Copier les nouveaux fichiers
    xcopy "frontend\build\*" "frontend-ovh\" /E /H /Y /EXCLUDE:exclude-html.txt
    
    echo ✅ Fichiers copiés !
    echo.
    echo 🎉 TERMINÉ !
    echo   - Nouvelle API : https://boulangerie-planning-api-4.onrender.com/api
    echo   - Fichiers prêts dans frontend-ovh/
    echo   - Prêt pour upload OVH
    echo.
) else (
    echo ❌ Erreur lors du build !
    cd ..
)

pause







