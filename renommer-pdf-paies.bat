@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Changer vers le répertoire où se trouve le script .bat
cd /d "%~dp0"

echo ========================================
echo    RENOMMAGE DES PDFS DE PAIES
echo ========================================
echo.
echo Ce script va analyser les fichiers PDF dans le repertoire
echo courant, extraire les noms des salaries et renommer les fichiers
echo au format: annee_mois Prenom NOM_Normal.pdf
echo.

REM Demander l'année et le mois si non spécifiés en argument
set "annee_mois="
if "%~1"=="" (
    set /p annee_mois="Annee et mois (format: 202512 pour decembre 2025) : "
) else (
    set "annee_mois=%~1"
)

if "!annee_mois!"=="" (
    echo ERREUR: L'annee et le mois sont obligatoires.
    pause
    exit /b 1
)

echo.
echo Annee-mois: !annee_mois!
echo.

REM Vérifier si Node.js est disponible
where node >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe ou n'est pas dans le PATH.
    echo Le script d'extraction automatique des noms necessite Node.js.
    pause
    exit /b 1
)

REM Vérifier si le script d'extraction existe
set "script_extraction=extraire-nom-pdf.js"
if not exist "!script_extraction!" (
    echo ERREUR: Le script !script_extraction! est introuvable.
    pause
    exit /b 1
)

echo Recherche des fichiers PDF a renommer...
echo.

REM Compter les fichiers PDF (sauf ceux déjà au bon format)
set "compteur=0"
for %%F in (*.pdf) do (
    set "nom_fichier=%%F"
    REM Vérifier si le fichier est déjà au format correct (_Normal.pdf)
    echo !nom_fichier! | findstr /C:"_Normal.pdf" >nul
    if errorlevel 1 (
        set /a compteur+=1
    )
)

if !compteur! equ 0 (
    echo Aucun fichier PDF a renommer trouve.
    echo Les fichiers sont deja au format correct ou aucun PDF present.
    pause
    exit /b 0
)

echo !compteur! fichier(s) PDF a traiter.
echo.

set "traite=0"
set "erreur=0"
set "compteur_duplicata=0"

REM Parcourir tous les fichiers PDF
for %%F in (*.pdf) do (
    set "nom_fichier=%%F"
    
    REM Ignorer les fichiers déjà au bon format
    echo !nom_fichier! | findstr /C:"_Normal.pdf" >nul
    if errorlevel 1 (
        echo Traitement de: !nom_fichier!
        
        REM Extraire le nom depuis le PDF
        set "nom_extraite="
        for /f "delims=" %%N in ('node "!script_extraction!" "!nom_fichier!" 2^>nul') do (
            set "nom_extraite=%%N"
        )
        
        if "!nom_extraite!"=="" (
            echo   [IGNORE] Impossible d'extraire le nom depuis !nom_fichier!
            set /a erreur+=1
        ) else (
            REM Générer le nouveau nom de fichier
            set "nouveau_nom=!annee_mois! !nom_extraite!_Normal.pdf"
            
            REM Vérifier si le fichier de destination existe déjà et trouver un nom disponible
            set "nom_final=!nouveau_nom!"
            set "compteur_test=1"
            :verifier_nom
            if exist "!nom_final!" (
                set /a compteur_test+=1
                set "nom_final=!annee_mois! !nom_extraite!_Normal_!compteur_test!.pdf"
                goto :verifier_nom
            )
            set "nouveau_nom=!nom_final!"
            
            REM Renommer le fichier
            ren "!nom_fichier!" "!nouveau_nom!" >nul 2>&1
            if errorlevel 1 (
                echo   [ERREUR] Echec du renommage de !nom_fichier!
                set /a erreur+=1
            ) else (
                echo   [OK] Renomme en: !nouveau_nom!
                set /a traite+=1
            )
        )
        echo.
    )
)

echo ========================================
echo    TRAITEMENT TERMINE
echo ========================================
echo.
echo Fichiers renommes avec succes: !traite!
if !erreur! gtr 0 (
    echo Fichiers avec erreur: !erreur!
)
echo.
pause
