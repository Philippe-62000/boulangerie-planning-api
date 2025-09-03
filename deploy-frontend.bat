@echo off
echo ========================================
echo    DEPLOIEMENT FRONTEND OVH
echo ========================================
echo.

echo [1/4] Nettoyage des anciens builds...
if exist "frontend\build" rmdir /s /q "frontend\build"
if exist "frontend\dist" rmdir /s /q "frontend\dist"
echo ✓ Nettoyage terminé
echo.

echo [2/4] Installation des dépendances...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)
echo ✓ Dépendances installées
echo.

echo [3/4] Construction du build de production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction
    pause
    exit /b 1
)
echo ✓ Build construit avec succès
echo.

echo [4/4] Préparation des fichiers pour OVH...
cd ..
if exist "deploy-ovh" rmdir /s /q "deploy-ovh"
mkdir "deploy-ovh"
xcopy "frontend\build\*" "deploy-ovh\" /E /I /Y

echo.
echo ========================================
echo    DEPLOIEMENT TERMINÉ !
echo ========================================
echo.
echo 📁 Dossier de déploiement créé : deploy-ovh\
echo.
echo 📋 Instructions pour FileZilla :
echo    1. Ouvrir FileZilla
echo    2. Se connecter à votre serveur OVH
echo    3. Naviguer vers le dossier www ou public_html
echo    4. Glisser-déposer le contenu de deploy-ovh\
echo    5. Remplacer tous les fichiers existants
echo.
echo ⚠️  ATTENTION : Sauvegardez votre site actuel !
echo.
pause

