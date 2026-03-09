@echo off
chcp 65001 >nul
echo ========================================
echo   EXTRACTION LISTE FEUILLES PRESENCE
echo ========================================
echo.

set "REP=%~dp0"
if not exist "%REP%backend\scripts\extract-feuilles-presence.js" (
    set "REP=c:\boulangerie-planning\"
)
if "%~1"=="" (
    echo Recherche du PDF feuille-presence dans le répertoire courant...
    set "PDF=%CD%"
) else (
    set "PDF=%~1"
)

if exist "%PDF%" if "%~x1"==".pdf" set "PDFF=%PDF%" & goto :found
if exist "%PDF%\feuille-presence*.pdf" (
    for %%f in ("%PDF%\feuille-presence*.pdf") do set "PDFF=%%f" & goto :found
)
if exist "feuille-presence*.pdf" (
    for %%f in (feuille-presence*.pdf) do set "PDFF=%%~ff" & goto :found
)
if exist "%REP%feuille-presence*.pdf" (
    for %%f in ("%REP%feuille-presence*.pdf") do set "PDFF=%%~ff" & goto :found
)

echo Aucun PDF feuille-presence trouvé.
echo.
echo Usage: extraire-liste-feuilles-presence.bat [dossier ou chemin PDF]
echo   Exemple: extraire-liste-feuilles-presence.bat C:\Documents
echo   Exemple: extraire-liste-feuilles-presence.bat C:\Documents\feuille-presence-2026-02.pdf
echo.
pause
exit /b 1

:found
for %%a in ("%PDFF%") do set "OUTDIR=%%~dpa"
set "OUTPUT=%OUTDIR%ordre.txt"
if "%~2" neq "" set "OUTPUT=%~2"

echo PDF: %PDFF%
echo Sortie: %OUTPUT%
echo.

cd /d "%REP%"
set "SCRIPT=%REP%backend\scripts\extract-feuilles-presence.js"
node "%SCRIPT%" "%PDFF%" "%OUTPUT%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Terminé !
    type "%OUTPUT%"
) else (
    echo.
    echo ❌ Erreur lors de l'extraction
)

echo.
pause
