@echo off
echo ========================================
echo   TEST CORRIGE : MIGRATION + FONCTIONNALITES
echo ========================================

echo.
echo 1. Migration des employes (corrigee)...
node migrate-employees-fixed.js

echo.
echo 2. Test simple des fonctionnalites API...
node test-simple.js

echo.
echo 3. Test de l'application web...
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
echo ✅ Test corrige termine !
pause





