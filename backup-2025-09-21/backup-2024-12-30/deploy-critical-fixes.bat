@echo off
echo 🚨 Déploiement des corrections critiques...
echo.

echo 📝 Commit des corrections critiques...
git add .
git commit -m "Fix: Corrections critiques - Routes auth, API parsing, Messages erreur"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ CORRECTIONS CRITIQUES DÉPLOYÉES !
echo.
echo 📋 Corrections appliquées :
echo    ✅ Route d'envoi mot de passe : Routes auth réactivées
echo    ✅ Lien vacation-request : Corrigé (/plan/vacation-request-standalone.html)
echo    ✅ API vacation-request : Correction du parsing des données
echo    ✅ Message erreur connexion : Amélioration des messages d'erreur
echo    ✅ Frais KM : Amélioration du filtrage des paramètres
echo.
echo 🔄 Render va redéployer automatiquement...
echo.
echo 📋 Corrections restantes à tester :
echo    - Bouton sauvegarder statistiques de vente
echo    - Tableau frais de repas (une seule colonne)
echo    - En-têtes frais KM (2 au lieu de 18)
echo.
echo 🎯 Testez maintenant :
echo    1. Envoi de mot de passe depuis gestion employés
echo    2. Lien formulaire de demande de congé
echo    3. Connexion salarié avec mauvais mot de passe
echo.
pause
