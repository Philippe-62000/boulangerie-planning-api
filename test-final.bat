@echo off
echo ========================================
echo   TEST FINAL : MIGRATION + VERIFICATION
echo ========================================

echo.
echo 1. Migration des employes via API...
node migrate-via-api.js

echo.
echo 2. Verification des resultats...
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
echo 4. Environnements configures:
echo - Backend: Render (https://boulangerie-planning-api.onrender.com)
echo - Frontend: OVH (https://www.filmara.fr/plan/)
echo - Base de donnees: MongoDB Atlas
echo - Documentation: ARCHITECTURE-PROJET.md mis a jour

echo.
echo ✅ Test final termine !
echo 📋 Documentation mise a jour avec les environnements requis
pause





