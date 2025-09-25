@echo off
echo 🚀 Déploiement du frontend avec toutes les corrections...
echo.

echo 📝 Commit des corrections frontend...
git add .
git commit -m "Fix: Déploiement frontend avec toutes les corrections"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ Frontend déployé !
echo.
echo 📋 Corrections frontend appliquées :
echo    ✅ Email employé : Correction de l'enregistrement
echo    ✅ État des absences : Correction du parsing des données API
echo    ✅ Frais repas : Correction du format des données API
echo    ✅ Gestion des employés : Colonne "Absences" ajoutée
echo    ✅ Bouton mot de passe : Ajouté dans la fenêtre employé
echo.
echo 🔄 Render va redéployer automatiquement le frontend...
echo.
echo 🎯 Le tableau des statistiques de vente devrait maintenant s'afficher correctement !
echo.
pause
