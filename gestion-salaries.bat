@echo off
chcp 65001 >nul 2>&1
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

:MENU
cls
echo ========================================
echo    GESTION DES SALARIES - MENU
echo ========================================
echo.
echo 1. Lister les noms des salaries
echo 2. Ajouter un salarie
echo 3. Supprimer un salarie
echo 4. Voir le mot de passe d'un salarie
echo 5. Lister tous les salaries avec leurs mots de passe
echo 6. Quitter
echo.
echo ========================================
set /p choix="Votre choix (1-6) : "

if "%choix%"=="1" goto LISTE_NOMS
if "%choix%"=="2" goto AJOUTER
if "%choix%"=="3" goto SUPPRIMER
if "%choix%"=="4" goto VOIR_MDP
if "%choix%"=="5" goto LISTE_COMPLETE
if "%choix%"=="6" goto FIN

echo.
echo Choix invalide. Veuillez choisir entre 1 et 6.
timeout /t 2 >nul 2>&1
goto MENU

:LISTE_NOMS
cls
echo ========================================
echo    LISTE DES SALARIES
echo ========================================
echo.
set /a compteur=0
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:~0,8!"=="set \"pwd" (
        REM Extraire le nom: format set "pwd_NOM=mdp"
        set "partie=!ligne_test:~9!"
        for /f "tokens=1 delims==" %%b in ('echo !partie!') do (
            set "nom=%%b"
            set "nom=!nom:"=!"
            set /a compteur+=1
            echo !compteur!. !nom!
        )
    )
)
if !compteur! equ 0 (
    echo Aucun salarie trouve.
) else (
    echo.
    echo Total: !compteur! salarie(s)
)
echo.
pause
goto MENU

:AJOUTER
cls
echo ========================================
echo    AJOUTER UN SALARIE
echo ========================================
echo.
set /p nom="Nom du salarie (en MAJUSCULES) : "

if "!nom!"=="" (
    echo.
    echo ERREUR: Le nom ne peut pas etre vide !
    echo.
    pause
    goto MENU
)

REM Vérifier si le nom existe déjà
set "existe_deja=0"
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:pwd_!nom!=!" neq "!ligne_test!" (
        set "existe_deja=1"
    )
)
if "!existe_deja!"=="1" (
    echo.
    echo ERREUR: Le salarie !nom! existe deja !
    echo.
    pause
    goto MENU
)

REM Générer un mot de passe aléatoire de 10 caractères avec chiffres et caractères spéciaux
set "mdp="
for /f "delims=" %%p in ('powershell -NoProfile -Command "$letters='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; $digits='0123456789'; $special='@#$'; $pwd=''; for($i=0; $i -lt 8; $i++) { $pwd += $letters[(Get-Random -Maximum $letters.Length)] }; $pwd += $digits[(Get-Random -Maximum $digits.Length)]; $pwd += $special[(Get-Random -Maximum $special.Length)]; $pwdArray = $pwd.ToCharArray(); for($i=$pwdArray.Length-1; $i -ge 0; $i--) { $j = Get-Random -Maximum ($i+1); $tmp = $pwdArray[$i]; $pwdArray[$i] = $pwdArray[$j]; $pwdArray[$j] = $tmp }; -join $pwdArray" 2^>nul') do set "mdp=%%p"

if "!mdp!"=="" (
    echo ERREUR: Impossible de generer le mot de passe.
    pause
    goto MENU
)

echo.
echo Mot de passe genere: !mdp!
echo.

REM Créer le fichier temporaire
set "temp=mots_de_passe_temp.bat"
if exist "%temp%" del "%temp%" >nul 2>&1

REM Trouver la dernière ligne pwd_ et ajouter après
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
    
    REM Comparer avec la dernière ligne pwd_ trouvée
    if defined derniere_pwd (
        if "!ligne!"=="!derniere_pwd!" (
            if "!ajout_fait!"=="0" (
                echo set "pwd_!nom!=!mdp!">>"%temp%"
                set "ajout_fait=1"
            )
        )
    )
)

if exist "%temp%" (
    if "!ajout_fait!"=="1" (
        copy /y "%temp%" mots_de_passe.bat >nul 2>&1
        del "%temp%" >nul 2>&1
        echo Salarie !nom! ajoute avec succes !
        echo Le mot de passe a ete sauvegarde.
    ) else (
        echo ERREUR: Probleme lors de l'ajout.
        del "%temp%" >nul 2>&1
    )
) else (
    echo ERREUR: Impossible de creer le fichier temporaire.
)
echo.
pause
goto MENU

:SUPPRIMER
cls
echo ========================================
echo    SUPPRIMER UN SALARIE
echo ========================================
echo.
set /p nom="Nom du salarie a supprimer (en MAJUSCULES) : "

if "!nom!"=="" (
    echo.
    echo ERREUR: Le nom ne peut pas etre vide !
    echo.
    pause
    goto MENU
)

REM Vérifier si le nom existe
set "existe=0"
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:pwd_!nom!=!" neq "!ligne_test!" (
        set "existe=1"
    )
)
if "!existe!"=="0" (
    echo.
    echo ERREUR: Le salarie !nom! n'existe pas !
    echo.
    pause
    goto MENU
)

echo.
set /p confirm="Etes-vous sur de vouloir supprimer !nom! ? (O/N) : "
if /I not "!confirm!"=="O" (
    echo Suppression annulee.
    pause
    goto MENU
)

REM Créer un fichier temporaire sans la ligne du salarié
set "temp=mots_de_passe_temp.bat"
if exist "%temp%" del "%temp%" >nul 2>&1

for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    set "garder=1"
    if "!ligne_test:pwd_!nom!=!" neq "!ligne_test!" set "garder=0"
    if "!garder!"=="1" echo !ligne!>>"%temp%"
)

if exist "%temp%" (
    copy /y "%temp%" mots_de_passe.bat >nul 2>&1
    del "%temp%" >nul 2>&1
    echo.
    echo Salarie !nom! supprime avec succes !
) else (
    echo ERREUR: Impossible de creer le fichier temporaire.
)
echo.
pause
goto MENU

:VOIR_MDP
cls
echo ========================================
echo    VOIR MOT DE PASSE D'UN SALARIE
echo ========================================
echo.
set /p nom="Nom du salarie (en MAJUSCULES) : "

if "!nom!"=="" (
    echo.
    echo ERREUR: Le nom ne peut pas etre vide !
    echo.
    pause
    goto MENU
)

REM Chercher le mot de passe dans le fichier
set "mdp_trouve=0"
set "mdp="
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:pwd_!nom!=!" neq "!ligne_test!" (
        REM Extraire le mot de passe
        for /f "tokens=2 delims==" %%b in ('echo !ligne!') do (
            set "mdp_ligne=%%b"
            set "mdp=!mdp_ligne:"=!"
            set "mdp_trouve=1"
        )
    )
)

if "!mdp_trouve!"=="0" (
    echo.
    echo ERREUR: Le salarie !nom! n'existe pas !
    echo.
    pause
    goto MENU
)

echo.
echo ========================================
echo Salarie: !nom!
echo Mot de passe: !mdp!
echo ========================================
echo.
pause
goto MENU

:LISTE_COMPLETE
cls
echo ========================================
echo    SALARIES ET MOTS DE PASSE
echo ========================================
echo.
set /a compteur=0
for /f "usebackq tokens=*" %%a in ("mots_de_passe.bat") do (
    set "ligne=%%a"
    set "ligne_test=!ligne!"
    if "!ligne_test:~0,8!"=="set \"pwd" (
        set /a compteur+=1
        echo !compteur!. !ligne!
    )
)
if !compteur! equ 0 (
    echo Aucun salarie trouve.
) else (
    echo.
    echo Total: !compteur! salarie(s)
)
echo.
pause
goto MENU

:FIN
cls
echo.
echo Au revoir !
timeout /t 2 >nul 2>&1
exit /b 0
