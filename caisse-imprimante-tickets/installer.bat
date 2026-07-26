@echo off
chcp 65001 >nul
echo ============================================================
echo   INSTALLATION AGENT IMPRESSION FILMARA (caisse Crisalid)
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "config.json" (
    echo ERREUR : copiez d'abord config.arras.json OU config.longuenesse.json
    echo          vers config.json, puis renseignez la cle printKey dedans.
    pause
    exit /b 1
)

echo 1. Creation du lanceur au demarrage de Windows...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
(
echo Set sh = CreateObject("Wscript.Shell"^)
echo sh.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File ""%~dp0print-agent.ps1""", 0, False
) > "%STARTUP%\filmara-print-agent.vbs"
echo    OK : %STARTUP%\filmara-print-agent.vbs

echo.
echo 2. Demarrage immediat de l'agent...
wscript "%STARTUP%\filmara-print-agent.vbs"
echo    OK : l'agent tourne en arriere-plan.

echo.
echo ============================================================
echo   INSTALLATION TERMINEE
echo   - L'agent demarre desormais automatiquement avec Windows.
echo   - Journal : print-agent.log dans ce dossier.
echo   - Test    : double-cliquez test-impression.bat
echo ============================================================
pause
