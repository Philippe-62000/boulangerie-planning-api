@echo off
echo ========================================
echo    TEST DU HEADER MODIFIÉ
echo ========================================
echo.

echo [1/3] Vérification des modifications...
echo ✅ Logo FILMARA supprimé
echo ✅ Numéro de semaine ajouté (S34)
echo ✅ Date du jour ajoutée (Lundi 28 Septembre)
echo.

echo [2/3] Démarrage du serveur de développement...
echo.
echo 📱 Le navigateur devrait s'ouvrir automatiquement
echo 🌐 URL: http://localhost:3000
echo.
echo 🔍 Vérifications à faire :
echo    - Le logo FILMARA a disparu
echo    - Affichage "S34" (semaine actuelle)
echo    - Affichage "Lundi 28 Septembre" (date actuelle)
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

