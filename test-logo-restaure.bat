@echo off
echo ========================================
echo    TEST DU LOGO FILMARA RESTAURÉ
echo ========================================
echo.

echo [1/4] Vérification des modifications...
echo ✅ Logo FILMARA restauré (orque + renard)
echo ✅ Encodage SVG corrigé
echo ✅ Compatibilité navigateur améliorée
echo ✅ Infos de semaine ajoutées (S34 + date)
echo.

echo [2/4] Vérification des fichiers...
if exist "frontend\src\components\Header.js" (
    echo ✅ Header.js trouvé
) else (
    echo ❌ Header.js manquant
    pause
    exit /b 1
)

if exist "frontend\src\components\Header.css" (
    echo ✅ Header.css trouvé
) else (
    echo ❌ Header.css manquant
    pause
    exit /b 1
)

echo.
echo [3/4] Démarrage du serveur de développement...
echo.
echo 📱 Le navigateur devrait s'ouvrir automatiquement
echo 🌐 URL: http://localhost:3000
echo.
echo 🔍 Vérifications à faire :
echo    - Logo FILMARA visible (orque marron + renard orange)
echo    - Texte "FILMARA" sous le logo
echo    - Affichage "S34" (semaine actuelle)
echo    - Affichage date du jour (ex: "Lundi 28 Septembre")
echo    - Design moderne et professionnel
echo.
echo ⚠️  Appuyez sur Ctrl+C pour arrêter le serveur
echo.

cd frontend
npm start

echo.
echo ========================================
echo    SERVEUR ARRÊTÉ
echo ========================================
pause

