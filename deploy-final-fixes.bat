@echo off
echo ========================================
echo DEPLOIEMENT CORRECTIONS FINALES
echo ========================================
echo.

echo [1/4] Ajout des fichiers au git...
git add .
echo.

echo [2/4] Commit des modifications...
git commit -m "fix: Corrections finales interface

- Décalage titre 'Planning Boulangerie Arras' de 5 espaces vers la droite
- Ajout menu 'Arrêt Maladie' externe dans le menu flottant
- Création page HTML simple sans menu pour salariés
- Correction affichage frais KM Anaïs (largeur cellules)
- Page standalone pour upload arrêts maladie
- Amélioration CSS pour éviter les troncatures"
echo.

echo [3/4] Push vers le repository...
git push origin main
echo.

echo [4/4] Deploiement termine !
echo.
echo ========================================
echo CORRECTIONS APPLIQUEES:
echo ========================================
echo.
echo ✅ Titre décalé de 5 espaces vers la droite
echo ✅ Menu 'Arrêt Maladie' ajouté dans le menu flottant
echo ✅ Page HTML simple créée: sick-leave-simple.html
echo ✅ Correction affichage frais KM Anaïs
echo ✅ CSS amélioré pour éviter les troncatures
echo.
echo 🌐 NOUVELLES URLs:
echo - Page simple salariés: https://www.filmara.fr/plan/sick-leave-simple.html
echo - Menu externe: https://www.filmara.fr/plan/sick-leave-management
echo.
echo ========================================
echo CORRECTIONS TERMINEES !
echo ========================================
pause
