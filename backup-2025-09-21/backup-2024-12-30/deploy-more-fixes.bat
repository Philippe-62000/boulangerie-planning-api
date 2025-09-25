@echo off
echo 🔧 Déploiement des corrections supplémentaires...
echo.

echo 📝 Commit des corrections...
git add .
git commit -m "Fix: Corrections supplémentaires - Email employé, État absences, Frais repas tableau"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ Corrections déployées !
echo.
echo 📋 Corrections appliquées :
echo    - ✅ Email employé : Correction de l'enregistrement dans création/modification
echo    - ✅ État des absences : Correction pour utiliser les absences du modèle Employee
echo    - ✅ Frais repas : Correction du format des données API
echo.
echo 🔄 Render va redéployer automatiquement...
echo.
echo 📋 Corrections restantes :
echo    - Menu gestion des congés dans les permissions
echo    - Colonnes supplémentaires paramètres KM
echo    - Bouton effacer arrêts maladie (erreur 500)
echo    - Bouton mot de passe dans fenêtre employé
echo.
pause
