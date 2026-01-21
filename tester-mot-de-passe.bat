@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo    TEST DU MOT DE PASSE
echo ========================================
echo.

set /p nom="Nom du salarie (en MAJUSCULES) : "

if "!nom!"=="" (
    echo ERREUR: Le nom ne peut pas etre vide.
    pause
    exit /b 1
)

REM Charger les mots de passe
if exist "mots_de_passe.bat" (
    call "mots_de_passe.bat"
) else (
    echo ERREUR: Le fichier mots_de_passe.bat est introuvable.
    pause
    exit /b 1
)

REM Vérifier si le mot de passe existe en cherchant dans le fichier
set "mdp_trouve=0"
set "mdp="
for /f "tokens=*" %%a in ('findstr /C:"pwd_!nom!" mots_de_passe.bat 2^>nul') do (
    set "ligne=%%a"
    REM Extraire le mot de passe (format: set "pwd_NOM=mdp")
    for /f "tokens=2 delims==" %%b in ("!ligne!") do (
        set "mdp_ligne=%%b"
        set "mdp=!mdp_ligne:"=!"
        set "mdp_trouve=1"
    )
)

if "!mdp_trouve!"=="1" (
    echo.
    echo Nom: !nom!
    echo Mot de passe: !mdp!
    echo.
    echo Vous pouvez maintenant tester ce mot de passe
    echo sur le fichier PDF protege.
    echo.
) else (
    echo.
    echo ERREUR: Aucun mot de passe trouve pour !nom!
    echo.
)

pause
