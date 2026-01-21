@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Chemin vers PDFtk
set "PDFTK=C:\Program Files (x86)\PDFtk\bin\pdftk.exe"

REM Charger les mots de passe depuis le fichier externe
if exist "mots_de_passe.bat" (
    call "mots_de_passe.bat"
) else (
    echo ERREUR: Le fichier mots_de_passe.bat est introuvable.
    pause
    exit /b 1
)

echo ========================================
echo Protection des fichiers PDF
echo ========================================
echo.

REM Créer le dossier Traite s'il n'existe pas
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
    
    REM Extraire le nom de famille depuis le nom de fichier
    REM Format attendu: YYYYMM NOM Prenom_Normal.pdf
    for /f "tokens=2 delims= " %%N in ("!filename!") do (
        set "nom=%%N"
        
        REM Chercher le mot de passe dans le fichier mots_de_passe.bat
        set "pwd="
        set "pwd_trouve=0"
        for /f "tokens=*" %%p in ('findstr /C:"pwd_!nom!" mots_de_passe.bat 2^>nul') do (
            set "ligne_pwd=%%p"
            REM Extraire le mot de passe (format: set "pwd_NOM=mdp")
            for /f "tokens=2 delims==" %%m in ("!ligne_pwd!") do (
                set "mdp_ligne=%%m"
                set "pwd=!mdp_ligne:"=!"
                set "pwd_trouve=1"
            )
        )
        
        REM Si un mot de passe a été trouvé
        if "!pwd_trouve!"=="1" (
            REM Remplacer _Normal par _Protege dans le nom
            set "newname=!filename:_Normal=_Protege!.pdf"
            
            echo Protection de %%F avec le mot de passe pour !nom!...
            
            "%PDFTK%" "%%F" output "Traite\!newname!" user_pw "!pwd!" encrypt_128bit
            
            if exist "Traite\!newname!" (
                echo [OK] %%F protege - Enregistre sous Traite\!newname!
            ) else (
                echo [ERREUR] Echec pour %%F
            )
            set "found=1"
        )
    )
    
    if !found! equ 0 (
        echo [IGNORE] Aucun mot de passe trouve pour %%F
    )
    echo.
)

echo ========================================
echo Traitement termine
echo Les fichiers proteges sont dans le dossier "Traite"
echo ========================================
pause
