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

echo ========================================
echo    IMPORT DEPUIS XML SEPA
echo ========================================
echo.
echo Ce script va analyser le fichier XML SEPA et
echo extraire automatiquement les noms des salaries.
echo.
echo Pour chaque nouveau salarie detecte, vous serez
echo demande si vous souhaitez le creer avec un mot de passe.
echo.
echo Pour chaque salarie present dans mots_de_passe.bat
echo mais absent du XML SEPA, vous serez demande si
echo vous souhaitez le supprimer.
echo.
pause

echo.
set /p xml_file="Nom du fichier XML SEPA (ex: VIREMENT SEPA 12-2025.xml) : "

if "!xml_file!"=="" (
    echo.
    echo ERREUR: Le nom du fichier ne peut pas etre vide !
    echo.
    pause
    exit /b 1
)

if not exist "!xml_file!" (
    echo.
    echo ERREUR: Le fichier !xml_file! est introuvable !
    echo.
    pause
    exit /b 1
)

echo.
echo Extraction des noms depuis le XML SEPA...
echo.

REM Créer une liste temporaire des salariés SEPA
set "temp_sepa_list=temp_sepa_list.txt"
if exist "%temp_sepa_list%" del "%temp_sepa_list%" >nul 2>&1

REM Utiliser PowerShell pour extraire les noms depuis le XML
REM Le format SEPA XML peut varier, mais généralement les noms sont dans des balises <Nm> ou <Dbtr> ou similaires
for /f "delims=" %%n in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$xml = [xml](Get-Content '!xml_file!' -Encoding UTF8); $names = @(); try { $nodes = $xml.SelectNodes('//*[local-name()=\"Nm\"]') } catch { try { $nodes = $xml.SelectNodes('//*[local-name()=\"Dbtr\"]//*[local-name()=\"Nm\"]') } catch { $nodes = $xml.SelectNodes('//DbtrNm') } }; if ($nodes -eq $null) { try { $nodes = $xml.SelectNodes('//Name') } catch {} }; if ($nodes -eq $null) { try { $nodes = $xml.SelectNodes('//Nom') } catch {} }; foreach ($node in $nodes) { $name = $node.InnerText.Trim(); if ($name -ne '' -and $name.Length -gt 2) { $names += $name } }; $names = $names | Select-Object -Unique; foreach ($name in $names) { $parts = $name -split ' '; if ($parts.Length -ge 1) { $parts[0].ToUpper() } }" 2^>nul') do (
    if not "%%n"=="" (
        echo %%n>> "%temp_sepa_list%"
    )
)

REM Si la méthode automatique n'a pas fonctionné, essayer une autre approche
if not exist "%temp_sepa_list%" (
    REM Créer le fichier vide pour la vérification
    echo. > "%temp_sepa_list%"
)

REM Vérifier si le fichier est vide ou trop petit
for %%f in ("%temp_sepa_list%") do set size=%%~zf
if !size! lss 3 (
    echo.
    echo La methode automatique n'a pas fonctionne.
    echo Essai avec une methode alternative...
    echo.
    
    REM Méthode alternative : chercher tous les textes qui ressemblent à des noms
    for /f "delims=" %%n in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$xml = [xml](Get-Content '!xml_file!' -Encoding UTF8); $xml.InnerText -split \"`r`n\" | Where-Object { $_ -match '^[A-Z][A-Z][A-Z][A-Z]+' -and $_.Length -lt 30 -and $_ -notmatch '[0-9]' } | Select-Object -First 20 | ForEach-Object { $_.Trim().Split(' ')[0].ToUpper() } | Select-Object -Unique" 2^>nul') do (
        if not "%%n"=="" (
            echo %%n>> "%temp_sepa_list%"
        )
    )
)

REM Vérifier à nouveau
for %%f in ("%temp_sepa_list%") do set size=%%~zf
if !size! lss 3 (
    echo.
    echo ERREUR: Impossible d'extraire les noms depuis le XML.
    echo.
    echo Format XML attendu: Les noms doivent etre dans des balises comme:
    echo   - ^<Nm^>Nom Prenom^</Nm^>
    echo   - ^<DbtrNm^>Nom Prenom^</DbtrNm^>
    echo   - ^<Name^>Nom Prenom^</Name^>
    echo.
    echo Veuillez verifier le format de votre fichier XML.
    echo.
    if exist "%temp_sepa_list%" del "%temp_sepa_list%" >nul 2>&1
    pause
    exit /b 1
)

REM Afficher les noms extraits
echo.
echo Noms extraits depuis le XML:
echo.
set /a count_display=0
for /f "usebackq tokens=*" %%a in ("%temp_sepa_list%") do (
    set /a count_display+=1
    echo !count_display!. %%a
)
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
            for /f "delims=" %%p in ('powershell -NoProfile -Command "$letters='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; $digits='0123456789'; $special='@#$'; $pwd=''; for($i=0; $i -lt 8; $i++) { $pwd += $letters[(Get-Random -Maximum $letters.Length)] }; $pwd += $digits[(Get-Random -Maximum $digits.Length)]; $pwd += $special[(Get-Random -Maximum $special.Length)]; $pwdArray = $pwd.ToCharArray(); for($i=$pwdArray.Length-1; $i -ge 0; $i--) { $j = Get-Random -Maximum ($i+1); $tmp = $pwdArray[$i]; $pwdArray[$i] = $pwdArray[$j]; $pwdArray[$j] = $tmp }; -join $pwdArray" 2^>nul') do set "mdp=%%p"
            
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
        set "partie=!ligne_test:~9!"
        for /f "tokens=1 delims==" %%b in ('echo !partie!') do (
            set "nom_existant=%%b"
            set "nom_existant=!nom_existant:"=!"
            
            REM Vérifier si ce nom est dans la liste SEPA
            set "dans_sepa=0"
            for /f "usebackq tokens=*" %%c in ("%temp_sepa_list%") do (
                if "%%c"=="!nom_existant!" set "dans_sepa=1"
            )
            
            if "!dans_sepa!"=="0" (
                echo.
                echo ========================================
                echo Salarie absent du XML SEPA: !nom_existant!
                echo ========================================
                REM Afficher le mot de passe actuel
                for /f "tokens=2 delims==" %%d in ('echo !ligne!') do (
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
if exist "%temp_sepa_list%" del "%temp_sepa_list%" >nul 2>&1

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
if exist "%temp%" del "%temp%" >nul 2>&1

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
if exist "%temp%" del "%temp%" >nul 2>&1

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
