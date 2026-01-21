@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Vérifier que mots_de_passe.bat existe
if not exist "mots_de_passe.bat" (
    echo ========================================
    echo    ERREUR
    echo ========================================
    echo.
    echo Le fichier mots_de_passe.bat est introuvable.
    echo Veuillez vous assurer que ce fichier existe
    echo dans le meme repertoire que ce script.
    echo.
    pause
    exit /b 1
)

echo ========================================
echo    IMPORT DEPUIS PDF SEPA
echo ========================================
echo.
echo Ce script va analyser les salaries du PDF SEPA.
echo.
echo Pour chaque nouveau salarie detecte, vous serez
echo demande si vous souhaitez le creer avec un mot de passe.
echo.
echo Pour chaque salarie present dans mots_de_passe.bat
echo mais absent du PDF SEPA, vous serez demande si
echo vous souhaitez le supprimer.
echo.
pause

echo.
echo ========================================
echo    SAISIE DES NOMS DU PDF SEPA
echo ========================================
echo.
echo Veuillez entrer les noms des salaries presents
echo dans le PDF SEPA (un nom par ligne).
echo.
echo Format: NOM (en majuscules, sans prenom)
echo Exemple: CASTEL, DELADERIERE, etc.
echo.
echo Tapez FIN pour terminer la saisie.
echo.

REM Créer une liste temporaire des salariés SEPA
set "temp_sepa_list=temp_sepa_list.txt"
if exist "%temp_sepa_list%" del "%temp_sepa_list%"

set "sepa_count=0"
:SAISIE_SEPA
set /p nom_sepa="Nom du salarie (ou FIN pour terminer) : "
if /I "!nom_sepa!"=="FIN" goto :FIN_SAISIE_SEPA
if "!nom_sepa!"=="" goto :SAISIE_SEPA

REM Convertir en majuscules et nettoyer
set "nom_sepa=!nom_sepa: =!"
set "nom_sepa=!nom_sepa:a=A!"
set "nom_sepa=!nom_sepa:b=B!"
set "nom_sepa=!nom_sepa:c=C!"
set "nom_sepa=!nom_sepa:d=D!"
set "nom_sepa=!nom_sepa:e=E!"
set "nom_sepa=!nom_sepa:f=F!"
set "nom_sepa=!nom_sepa:g=G!"
set "nom_sepa=!nom_sepa:h=H!"
set "nom_sepa=!nom_sepa:i=I!"
set "nom_sepa=!nom_sepa:j=J!"
set "nom_sepa=!nom_sepa:k=K!"
set "nom_sepa=!nom_sepa:l=L!"
set "nom_sepa=!nom_sepa:m=M!"
set "nom_sepa=!nom_sepa:n=N!"
set "nom_sepa=!nom_sepa:o=O!"
set "nom_sepa=!nom_sepa:p=P!"
set "nom_sepa=!nom_sepa:q=Q!"
set "nom_sepa=!nom_sepa:r=R!"
set "nom_sepa=!nom_sepa:s=S!"
set "nom_sepa=!nom_sepa:t=T!"
set "nom_sepa=!nom_sepa:u=U!"
set "nom_sepa=!nom_sepa:v=V!"
set "nom_sepa=!nom_sepa:w=W!"
set "nom_sepa=!nom_sepa:x=X!"
set "nom_sepa=!nom_sepa:y=Y!"
set "nom_sepa=!nom_sepa:z=Z!"

echo !nom_sepa!>> "%temp_sepa_list%"
set /a sepa_count+=1
goto :SAISIE_SEPA

:FIN_SAISIE_SEPA

if !sepa_count! equ 0 (
    echo.
    echo Aucun salarie saisi. Import annule.
    echo.
    if exist "%temp_sepa_list%" del "%temp_sepa_list%"
    pause
    exit /b 0
)

echo.
echo !sepa_count! salarie(s) saisi(s).
echo.
pause

echo.
echo ========================================
echo    TRAITEMENT DES NOUVEAUX SALARIES
echo ========================================
echo.

REM Parcourir les salariés du SEPA
set "nouveaux_ajoutes=0"
for /f "usebackq tokens=*" %%a in ("%temp_sepa_list%") do (
    set "nom_sepa=%%a"
    
    REM Vérifier si le salarié existe déjà
    set "existe=0"
    for /f "usebackq tokens=*" %%b in ("mots_de_passe.bat") do (
        set "ligne=%%b"
        set "ligne_test=!ligne!"
        if "!ligne_test:pwd_!nom_sepa!=!" neq "!ligne_test!" (
            set "existe=1"
        )
    )
    
    if "!existe!"=="0" (
        echo.
        echo ========================================
        echo Nouveau salarie detecte: !nom_sepa!
        echo ========================================
        set /p creer="Voulez-vous creer ce salarie avec un mot de passe ? (O/N) : "
        if /I "!creer!"=="O" (
            REM Générer un mot de passe
            for /f "delims=" %%p in ('powershell -Command "$letters='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; $digits='0123456789'; $special='@#$'; $pwd=''; for($i=0; $i -lt 8; $i++) { $pwd += $letters[(Get-Random -Maximum $letters.Length)] }; $pwd += $digits[(Get-Random -Maximum $digits.Length)]; $pwd += $special[(Get-Random -Maximum $special.Length)]; $pwdArray = $pwd.ToCharArray(); for($i=$pwdArray.Length-1; $i -ge 0; $i--) { $j = Get-Random -Maximum ($i+1); $tmp = $pwdArray[$i]; $pwdArray[$i] = $pwdArray[$j]; $pwdArray[$j] = $tmp }; -join $pwdArray"') do set "mdp=%%p"
            
            REM Ajouter au fichier mots_de_passe.bat
            call :AJOUTER_SALARIE "!nom_sepa!" "!mdp!"
            set /a nouveaux_ajoutes+=1
            echo.
            echo [OK] Salarie !nom_sepa! ajoute avec le mot de passe: !mdp!
        ) else (
            echo Salarie !nom_sepa! ignore.
        )
    )
)

echo.
echo ========================================
echo    TRAITEMENT DES SALARIES ABSENTS
echo ========================================
echo.

REM Parcourir les salariés existants dans mots_de_passe.bat
set "supprimes=0"
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:~0,8!"=="set \"pwd" (
        REM Extraire le nom
        for /f "tokens=2 delims=_=" %%b in ("!ligne!") do (
            set "nom_existant=%%b"
            
            REM Vérifier si ce nom est dans la liste SEPA
            set "dans_sepa=0"
            for /f "usebackq tokens=*" %%c in ("%temp_sepa_list%") do (
                if "%%c"=="!nom_existant!" set "dans_sepa=1"
            )
            
            if "!dans_sepa!"=="0" (
                echo.
                echo ========================================
                echo Salarie absent du PDF SEPA: !nom_existant!
                echo ========================================
                REM Afficher le mot de passe actuel
                for /f "tokens=2 delims==" %%d in ("!ligne!") do (
                    set "mdp_ligne=%%d"
                    set "mdp_actuel=!mdp_ligne:"=!"
                    echo Mot de passe actuel: !mdp_actuel!
                )
                set /p supprimer="Voulez-vous supprimer ce salarie ? (O/N) : "
                if /I "!supprimer!"=="O" (
                    call :SUPPRIMER_SALARIE "!nom_existant!"
                    set /a supprimes+=1
                    echo.
                    echo [OK] Salarie !nom_existant! supprime.
                ) else (
                    echo Salarie !nom_existant! conserve.
                )
            )
        )
    )
)

REM Nettoyer les fichiers temporaires
if exist "%temp_sepa_list%" del "%temp_sepa_list%"

echo.
echo ========================================
echo    IMPORT TERMINE
echo ========================================
echo.
echo Nouveaux salaries ajoutes: !nouveaux_ajoutes!
echo Salaries supprimes: !supprimes!
echo.
pause
exit /b 0

REM Fonction pour ajouter un salarié
:AJOUTER_SALARIE
set "nom_ajout=%~1"
set "mdp_ajout=%~2"

REM Créer le fichier temporaire
set "temp=mots_de_passe_temp.bat"
if exist "%temp%" del "%temp%"

REM Trouver la dernière ligne pwd_
set "derniere_pwd="
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:~0,8!"=="set \"pwd" (
        set "derniere_pwd=!ligne!"
    )
)

REM Recréer le fichier en ajoutant après la dernière ligne pwd_
set "ajout_fait=0"
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    echo !ligne!>>"%temp%"
    
    if defined derniere_pwd (
        if "!ligne!"=="!derniere_pwd!" (
            if "!ajout_fait!"=="0" (
                echo set "pwd_!nom_ajout!=!mdp_ajout!">>"%temp%"
                set "ajout_fait=1"
            )
        )
    )
)

if exist "%temp%" (
    if "!ajout_fait!"=="1" (
        copy /y "%temp%" mots_de_passe.bat >nul 2>&1
        del "%temp%" >nul 2>&1
    ) else (
        del "%temp%" >nul 2>&1
    )
)
exit /b

REM Fonction pour supprimer un salarié
:SUPPRIMER_SALARIE
set "nom_suppr=%~1"

REM Créer un fichier temporaire sans la ligne du salarié
set "temp=mots_de_passe_temp.bat"
if exist "%temp%" del "%temp%"

for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    set "garder=1"
    if "!ligne_test:pwd_!nom_suppr!=!" neq "!ligne_test!" set "garder=0"
    if "!garder!"=="1" echo !ligne!>>"%temp%"
)

if exist "%temp%" (
    copy /y "%temp%" mots_de_passe.bat >nul 2>&1
    del "%temp%" >nul 2>&1
)
exit /b
