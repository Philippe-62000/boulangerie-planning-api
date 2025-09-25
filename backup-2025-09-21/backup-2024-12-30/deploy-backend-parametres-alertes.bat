@echo off
echo ========================================
echo 🚀 DEPLOIEMENT BACKEND - PARAMÈTRES ALERTES
echo ========================================
echo.

echo 📋 Vérification des fichiers modifiés...
echo.

echo ✅ parametersController.js - Ajout paramètres alertes
if exist "backend\controllers\parametersController.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo ✅ Parameters.js - Ajout champ booleanValue
if exist "backend\models\Parameters.js" (
    echo    ✅ Fichier trouvé
) else (
    echo    ❌ Fichier manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Déploiement sur Render...
echo.

echo 📤 Push vers GitHub...
git add .
git commit -m "feat: Ajout paramètres alertes email (storeEmail, adminEmail, alertStore, alertAdmin)"
git push origin main

echo.
echo ========================================
echo ✅ DÉPLOIEMENT BACKEND TERMINÉ !
echo ========================================
echo.
echo 📋 Modifications déployées :
echo    - ✅ Ajout des paramètres storeEmail, adminEmail
echo    - ✅ Ajout des paramètres alertStore, alertAdmin (boolean)
echo    - ✅ Création automatique des paramètres manquants
echo    - ✅ Support des valeurs boolean dans l'API
echo.
echo 🚀 Render va redémarrer automatiquement...
echo.
echo 💡 Instructions de test :
echo    1. Attendre le redémarrage de Render (2-3 minutes)
echo    2. Aller sur https://www.filmara.fr/parametres
echo    3. Cliquer sur l'onglet "📋 Templates disponibles"
echo    4. Vérifier que les champs email sont maintenant modifiables
echo    5. Tester la configuration des alertes
echo.
echo 🎯 Nouvelles fonctionnalités :
echo    - 📧 Email du magasin configurable
echo    - 👑 Email de l'administrateur configurable
echo    - 🎯 Choix des destinataires (magasin/admin/les deux)
echo    - 💾 Sauvegarde automatique des paramètres
echo.
pause
