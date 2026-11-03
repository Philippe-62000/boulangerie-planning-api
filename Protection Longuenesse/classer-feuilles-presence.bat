@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo ========================================
echo   CLASSER FEUILLES DE PRESENCE A-Z
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH.
    pause
    exit /b 1
)

if not exist "%~dp0node_modules\pdf-lib\package.json" (
    echo Installation de pdf-lib (une seule fois)...
    call npm install --prefix "%~dp0"
    if errorlevel 1 (
        echo ERREUR: echec npm install pdf-lib
        pause
        exit /b 1
    )
    echo.
)

if "%~1"=="" (
    node "%~dp0classer-feuilles-presence.js"
) else (
    node "%~dp0classer-feuilles-presence.js" %*
)

echo.
pause
