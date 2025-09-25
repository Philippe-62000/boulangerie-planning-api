@echo off
echo 🔧 Déploiement des corrections multiples...
echo.

echo 📝 Commit des corrections...
git add .
git commit -m "Fix: Corrections multiples - Dashboard spacing, Vanessa sick leave, Sales stats table, Employee absence column"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ Corrections déployées !
echo.
echo 📋 Corrections appliquées :
echo    - ✅ Espacements améliorés dans le Dashboard
echo    - ✅ Nettoyage automatique des arrêts maladie expirés
echo    - ✅ Tableau de saisie corrigé dans Statistiques de vente
echo    - ✅ Colonne Absences ajoutée dans Gestion des employés
echo    - ✅ Script de nettoyage automatique au démarrage du serveur
echo.
echo 🔄 Render va redéployer automatiquement...
echo.
echo 📋 Prochaines corrections à faire :
echo    - Corriger l'enregistrement de l'email employé
echo    - Corriger la page état des absences
echo    - Corriger le tableau frais de repas
echo    - Corriger le menu gestion des congés
echo    - Corriger les colonnes paramètres KM
echo    - Corriger le bouton effacer arrêts maladie
echo    - Ajouter le bouton mot de passe
echo.
pause
