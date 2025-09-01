@echo off
echo ========================================
echo   TEST COMPLET : MIGRATION + FONCTIONNALITES
echo ========================================

echo.
echo 1. Migration des employes...
node migrate-employees-fixed.js

echo.
echo 2. Verification de la base de donnees...
node check-database.js

echo.
echo 3. Test des fonctionnalites API...
node test-fonctionnalites.js

echo.
echo 4. Test de l'application web...
echo URL: https://www.filmara.fr/plan/
echo.
echo Fonctionnalites a tester manuellement:
echo - Ajout/modification d'employes avec dates de naissance
echo - Declaration d'arret maladie
echo - Bouton "Declarer maladie" (doit etre bleu)
echo - Affichage des employes mineurs dans le dashboard
echo - Dates de fin de contrat pour les apprentis
echo - Boutons "Ferie" et "Ferme" dans les contraintes
echo - Generation de planning

echo.
echo ✅ Test complet termine !
pause





