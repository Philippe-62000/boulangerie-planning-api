@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Chemin vers PDFtk
set "PDFTK=C:\Program Files (x86)\PDFtk\bin\pdftk.exe"

echo ========================================
echo    DIVISION DU PDF DE PAIES
echo ========================================
echo.

REM Demander le nom du fichier PDF source
set /p fichier_source="Nom du fichier PDF source (ex: Paies_12_25_ORCINUS.pdf) : "
if "!fichier_source!"=="" (
    echo ERREUR: Aucun nom de fichier saisi.
    pause
    exit /b 1
)
if not exist "!fichier_source!" (
    echo.
    echo ========================================
    echo    ERREUR
    echo ========================================
    echo.
    echo Le fichier "!fichier_source!" est introuvable dans le repertoire courant.
    echo.
    echo Repertoire actuel:
    cd
    echo.
    echo Fichiers PDF presents dans le repertoire:
    dir /b *.pdf 2>nul
    if errorlevel 1 (
        echo Aucun fichier PDF trouve.
    )
    echo.
    echo Veuillez verifier que le fichier existe et reessayer.
    echo.
    pause
    exit /b 1
)

REM Extraire l'année et le mois du nom du fichier
REM Format attendu: Paies_MM_AA_ORCINUS.pdf ou Paies_12_25_ORCINUS.pdf
set "mois="
set "annee="

for /f "tokens=2,3 delims=_" %%A in ("!fichier_source!") do (
    set "mois=%%A"
    set "annee=%%B"
)

REM Construire annee_mois après la boucle
set "annee_mois=20!annee!!mois!"

REM Vérifier que annee_mois a été créé
if "!annee_mois!"=="" (
    echo.
    echo ERREUR: Impossible d'extraire l'annee et le mois du nom du fichier.
    echo Format attendu: Paies_MM_AA_ORCINUS.pdf (ex: Paies_12_25_ORCINUS.pdf)
    echo Fichier saisi: !fichier_source!
    echo Mois extrait: [!mois!]
    echo Annee extraite: [!annee!]
    pause
    exit /b 1
)

echo Annee-mois detecte: !annee_mois!
echo.

REM Compter le nombre de pages
echo Comptage du nombre de pages...
for /f "tokens=*" %%P in ('"%PDFTK%" "!fichier_source!" dump_data ^| findstr /C:"NumberOfPages"') do (
    for /f "tokens=2" %%N in ("%%P") do set "nombre_pages=%%N"
)

if "!nombre_pages!"=="" (
    echo ERREUR: Impossible de compter le nombre de pages.
    pause
    exit /b 1
)

echo Nombre de pages: !nombre_pages!
echo.

REM Créer un dossier temporaire pour les pages individuelles
set "dossier_temp=temp_pages"
if exist "!dossier_temp!" (
    echo Suppression de l'ancien dossier temporaire...
    rd /s /q "!dossier_temp!"
)
mkdir "!dossier_temp!"

REM Diviser le PDF en pages individuelles
echo Division du PDF en pages individuelles...
"%PDFTK%" "!fichier_source!" burst output "!dossier_temp!\page_%%02d.pdf"

if errorlevel 1 (
    echo ERREUR: Echec de la division du PDF.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    EXTRACTION AUTOMATIQUE DES NOMS
echo ========================================
echo.

REM Essayer d'extraire les noms automatiquement avec Node.js
set "script_extraction=extraire-noms-pages.js"
set "extraction_automatique=0"

if exist "!script_extraction!" (
    REM Vérifier si Node.js est disponible
    where node >nul 2>&1
    if !errorlevel! equ 0 (
        echo Tentative d'extraction automatique des noms...
        node "!script_extraction!" "!dossier_temp!" > "!dossier_temp!\noms_extraits.txt" 2>&1
        if !errorlevel! equ 0 (
            set "extraction_automatique=1"
            echo Extraction automatique reussie!
        ) else (
            echo Extraction automatique echouee, saisie manuelle necessaire.
        )
    ) else (
        echo Node.js n'est pas disponible, saisie manuelle necessaire.
    )
) else (
    echo Script d'extraction non trouve, saisie manuelle necessaire.
)

echo.

REM Si l'extraction automatique a échoué ou n'est pas disponible, demander la saisie manuelle
if "!extraction_automatique!"=="0" (
    echo ========================================
    echo    SAISIE MANUELLE DES NOMS
    echo ========================================
    echo.
    echo Veuillez entrer les noms des salaries dans l'ordre des pages.
    echo Format: Prenom NOM (ex: Clara LEGRAND)
    echo.
    echo Vous devez entrer !nombre_pages! nom(s).
    echo.
)

REM Créer un fichier temporaire pour stocker les noms
set "fichier_noms=!dossier_temp!\noms.txt"
if exist "!fichier_noms!" del "!fichier_noms!"

REM Si extraction automatique réussie, lire les noms depuis le fichier
if "!extraction_automatique!"=="1" (
    REM Filtrer les lignes qui ne sont pas des noms (supprimer les messages d'erreur, etc.)
    REM Garder uniquement les lignes qui ressemblent à des noms (pas de "❌", "📄", etc.)
    findstr /V /C:"❌" /C:"📄" /C:"✅" /C:"⚠️" /C:"📋" /C:"📊" /C:"fichiers PDF" /C:"Tentative" /C:"Erreur" /C:"extraction" /C:"Lecture" /C:"Nombre" "!dossier_temp!\noms_extraits.txt" > "!fichier_noms!" 2>nul
    
    REM Vérifier si on a le bon nombre de noms
    for /f %%C in ('find /c /v "" ^< "!fichier_noms!"') do set "nombre_noms_trouves=%%C"
    
    REM Si moins de noms que de pages, certains noms n'ont pas été trouvés
    if !nombre_noms_trouves! lss !nombre_pages! (
        echo.
        echo ATTENTION: Seulement !nombre_noms_trouves! nom(s) trouve(s) sur !nombre_pages! page(s).
        echo Certains noms n'ont pas pu etre extraits automatiquement.
        echo.
        type "!fichier_noms!"
        echo.
        set /p "continuer=Voulez-vous continuer avec ces noms et completer manuellement ? (O/N) : "
        if /I not "!continuer!"=="O" (
            set "extraction_automatique=0"
            del "!fichier_noms!"
        )
    ) else (
        echo.
        echo Noms extraits automatiquement avec succes!
        echo.
        type "!fichier_noms!"
        echo.
        set /p "confirmer=Confirmer ces noms ? (O/N) : "
        if /I not "!confirmer!"=="O" (
            set "extraction_automatique=0"
            del "!fichier_noms!"
        )
    )
)

REM Si l'extraction automatique a échoué ou a été refusée, demander la saisie manuelle
if "!extraction_automatique!"=="0" (
    set "compteur=1"
    :SAISIE_NOMS
    if !compteur! gtr !nombre_pages! goto :FIN_SAISIE
    
    set /p "nom=Nom du salarie pour la page !compteur! (Prenom NOM) : "
    if "!nom!"=="" (
        echo ERREUR: Le nom ne peut pas etre vide.
        goto :SAISIE_NOMS
    )
    
    REM Nettoyer le nom (supprimer les espaces multiples, etc.)
    set "nom_clean=!nom!"
    set "nom_clean=!nom_clean:  = !"
    
    REM Sauvegarder le nom dans le fichier
    echo !nom_clean!>> "!fichier_noms!"
    
    set /a compteur+=1
    goto :SAISIE_NOMS
    
    :FIN_SAISIE
    echo.
)

REM Renommer les fichiers PDF
echo Renommage des fichiers PDF...
set "compteur=1"
for /f "usebackq tokens=*" %%N in ("!fichier_noms!") do (
    set "nom=%%N"
    
    REM Générer le nom du fichier: annee_mois nom prénom_Normal.pdf
    REM Format: 202512 Clara LEGRAND_Normal.pdf (avec espace avant _Normal)
    set "nouveau_nom=!annee_mois! !nom!_Normal.pdf"
    
    REM Déterminer le nom du fichier page source
    set "fichier_page=!dossier_temp!\page_"
    if !compteur! lss 10 (
        set "fichier_page=!fichier_page!0!compteur!.pdf"
    ) else (
        set "fichier_page=!fichier_page!!compteur!.pdf"
    )
    
    if exist "!fichier_page!" (
        move "!fichier_page!" "!nouveau_nom!" >nul 2>&1
        if errorlevel 1 (
            echo [ERREUR] Echec du renommage pour la page !compteur! (!nom!)
        ) else (
            echo [OK] Page !compteur!: !nouveau_nom!
        )
    ) else (
        echo [ERREUR] Fichier page introuvable: !fichier_page!
    )
    
    set /a compteur+=1
)

REM Nettoyer le dossier temporaire
echo.
echo Nettoyage du dossier temporaire...
rd /s /q "!dossier_temp!"

echo.
echo ========================================
echo    TRAITEMENT TERMINE
echo ========================================
echo.
echo Les fichiers PDF ont ete crees avec les noms au format:
echo !annee_mois! Prenom NOM_Normal.pdf
echo.
echo Exemple: !annee_mois! Clara LEGRAND_Normal.pdf
echo.
pause
