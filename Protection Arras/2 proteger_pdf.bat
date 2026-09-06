@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Chemin vers PDFtk
set "PDFTK=C:\Program Files (x86)\PDFtk Server\bin\pdftk.exe"

if not exist "mots_de_passe.bat" (
    echo ERREUR: Le fichier mots_de_passe.bat est introuvable.
    pause
    exit /b 1
)
if not exist "%~dp0trouver-mot-de-passe.js" (
    echo ERREUR: trouver-mot-de-passe.js introuvable.
    pause
    exit /b 1
)

echo ========================================
echo Protection des fichiers PDF
echo ========================================
echo.
echo Homonymes: POUILLAUDE Laura / Nicolas → cles distinctes
echo.

if not exist "Traite" (
    mkdir "Traite"
    echo Dossier "Traite" cree.
)
echo.

echo Liste des fichiers PDF dans le repertoire:
dir /b *.pdf 2>nul
if errorlevel 1 (
    echo Aucun fichier PDF trouve.
    echo.
    pause
    exit /b 1
)
echo.

echo Traitement en cours...
echo.

for %%F in (*.pdf) do (
    set "filename=%%~nF"
    set "found=0"

    REM Apres la date AAAAMM : "POUILLAUDE Laura_Normal" ou "BERGEMAN_Normal"
    set "reste="
    for /f "tokens=1,* delims= " %%A in ("!filename!") do set "reste=%%B"

    if defined reste (
        set "pwd="
        for /f "usebackq delims=" %%P in (`node "%~dp0trouver-mot-de-passe.js" "!reste!" "%~dp0mots_de_passe.bat" 2^>nul`) do (
            set "pwd=%%P"
        )

        if defined pwd (
            set "newname=!filename:_Normal=_Protege!.pdf"
            echo Protection de %%F ...
            "%PDFTK%" "%%F" output "Traite\!newname!" user_pw "!pwd!" encrypt_128bit
            if exist "Traite\!newname!" (
                echo [OK] %%F protege - Enregistre sous Traite\!newname!
            ) else (
                echo [ERREUR] Echec pour %%F
            )
            set "found=1"
        )
    )

    if "!found!"=="0" (
        echo [IGNORE] Aucun mot de passe trouve pour %%F
        echo          Attendu pour homonymes: 202607 POUILLAUDE Laura_Normal.pdf
        echo          avec set "pwd_POUILLAUDE_LAURA=..." dans mots_de_passe.bat
    )
    echo.
)

echo ========================================
echo Traitement termine
echo Les fichiers proteges sont dans le dossier "Traite"
echo ========================================
pause
