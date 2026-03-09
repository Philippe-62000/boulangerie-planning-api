@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM ========================================
REM   CONCATENATION PDF Normal + _2
REM ========================================
REM Si un fichier *_Normal_2.pdf existe, concatene avec *_Normal.pdf
REM dans *_Normal_bis.pdf, puis supprime les deux fichiers sources.
REM Si seul *_Normal.pdf existe, ne fait rien.
REM ========================================

echo.
echo Recherche de fichiers *_Normal_2.pdf...
echo.

set "fusionne=0"

for %%F in (*_Normal_2.pdf) do (
    set "fichier2=%%F"
    set "base=%%~nF"
    REM base = 202601 MANTEL Melodie_Normal_2  -> on veut 202601 MANTEL Melodie_Normal
    set "base=!base:_Normal_2=!"
    set "fichier1=!base!_Normal.pdf"
    
    if exist "!fichier1!" (
        set "fichierBis=!base!_Normal_bis.pdf"
        echo Fichiers trouves: !fichier1! + !fichier2!
        echo Fusion vers: !fichierBis!
        echo.
        
        REM Essayer Ghostscript
        where gswin64c >nul 2>&1
        if !errorlevel! equ 0 (
            gswin64c -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="!fichierBis!" "!fichier1!" "!fichier2!"
            if !errorlevel! equ 0 (
                echo OK - Fusion reussie avec Ghostscript.
                del "!fichier1!" "!fichier2!"
                echo Fichiers sources supprimes.
                set "fusionne=1"
            ) else (
                echo ERREUR Ghostscript.
            )
        ) else (
            where gswin32c >nul 2>&1
            if !errorlevel! equ 0 (
                gswin32c -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="!fichierBis!" "!fichier1!" "!fichier2!"
                if !errorlevel! equ 0 (
                    echo OK - Fusion reussie avec Ghostscript.
                    del "!fichier1!" "!fichier2!"
                    echo Fichiers sources supprimes.
                    set "fusionne=1"
                ) else (
                    echo ERREUR Ghostscript.
                )
            ) else (
                REM Essayer pdftk
                where pdftk >nul 2>&1
                if !errorlevel! equ 0 (
                    pdftk "!fichier1!" "!fichier2!" cat output "!fichierBis!"
                    if !errorlevel! equ 0 (
                        echo OK - Fusion reussie avec pdftk.
                        del "!fichier1!" "!fichier2!"
                        echo Fichiers sources supprimes.
                        set "fusionne=1"
                    ) else (
                        echo ERREUR pdftk.
                    )
                ) else (
                    echo ERREUR: Aucun outil de fusion PDF trouve.
                    echo Installez Ghostscript ^(https://www.ghostscript.com^) ou PDFtk.
                    pause
                    exit /b 1
                )
            )
        )
        echo.
    ) else (
        echo Fichier !fichier2! trouve mais !fichier1! manquant - ignore.
        echo.
    )
)

if "!fusionne!"=="0" (
    echo Aucun fichier *_Normal_2.pdf trouve, ou aucun couple complet.
    echo Rien a faire.
)

echo.
pause
