@echo off
echo ========================================
echo 🔐 CONFIGURATION MOT DE PASSE APPLICATION
echo ========================================

echo.
echo 🎯 Ce script vous guide pour créer un mot de passe d'application Gmail
echo    nécessaire pour le service email de la Boulangerie Planning.
echo.

echo 📋 PRÉREQUIS:
echo    ✅ Compte Gmail actif
echo    ✅ Authentification à 2 facteurs OBLIGATOIRE
echo.

echo ⚠️  IMPORTANT: L'authentification à 2 facteurs est OBLIGATOIRE
echo    Si ce n'est pas activé, vous devez d'abord le faire.
echo.

pause

echo.
echo 🚀 ÉTAPE 1: Vérification de l'authentification à 2 facteurs
echo.
echo 📱 Ouvrez votre navigateur et allez sur:
echo    https://myaccount.google.com
echo.
echo 🔍 Vérifiez que "Validation en 2 étapes" est ACTIVÉE
echo    Si ce n'est pas le cas, activez-le d'abord.
echo.

pause

echo.
echo 🚀 ÉTAPE 2: Génération du mot de passe d'application
echo.
echo 📱 Dans votre navigateur:
echo    1. Allez sur: https://myaccount.google.com
echo    2. Cliquez sur "Sécurité" (menu de gauche)
echo    3. Cherchez "Mots de passe des applications"
echo    4. Cliquez sur "Mots de passe des applications"
echo.

pause

echo.
echo 🚀 ÉTAPE 3: Création du mot de passe
echo.
echo 📝 Dans la page "Mots de passe des applications":
echo    1. Sélectionnez "Autre (nom personnalisé)"
echo    2. Tapez: "Boulangerie Planning API"
echo    3. Cliquez sur "Générer"
echo    4. COPIEZ le mot de passe généré (16 caractères)
echo.

echo ⚠️  ATTENTION: Ce mot de passe ne s'affiche qu'UNE SEULE FOIS !
echo    Copiez-le immédiatement et collez-le dans un fichier texte.
echo.

pause

echo.
echo 🚀 ÉTAPE 4: Configuration sur Render
echo.
echo 📱 Ouvrez un nouvel onglet et allez sur:
echo    https://dashboard.render.com
echo.
echo 📋 Étapes sur Render:
echo    1. Connectez-vous à votre compte Render
echo    2. Sélectionnez le service "boulangerie-planning-api-3"
echo    3. Cliquez sur l'onglet "Environment"
echo    4. Ajoutez ces 4 variables:
echo.

echo 🔧 Variables à ajouter:
echo    SMTP_HOST = smtp.gmail.com
echo    SMTP_PORT = 587
echo    SMTP_USER = votre-email@gmail.com
echo    SMTP_PASS = [le mot de passe d'application copié]
echo.

echo ⚠️  IMPORTANT: 
echo    - Utilisez le mot de passe d'application SANS ESPACES
echo    - Remplacez "votre-email@gmail.com" par votre vrai email
echo.

pause

echo.
echo 🚀 ÉTAPE 5: Sauvegarde et redémarrage
echo.
echo 📋 Sur Render:
echo    1. Cliquez sur "Save Changes"
echo    2. Le service va redémarrer automatiquement
echo    3. Attendez que le déploiement soit terminé
echo.

pause

echo.
echo 🧪 ÉTAPE 6: Test de la configuration
echo.
echo 📱 Testez la configuration avec:
echo    node test-email-config.js
echo.
echo 📱 Ou testez directement l'API:
echo    https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.

echo.
echo ✅ CONFIGURATION TERMINÉE !
echo.
echo 📋 Résumé de ce qui a été configuré:
echo    ✅ Mot de passe d'application Gmail créé
echo    ✅ Variables SMTP configurées sur Render
echo    ✅ Service email prêt à fonctionner
echo.
echo 📧 Le service enverra maintenant automatiquement:
echo    ✅ Emails de validation aux salariés
echo    ✅ Emails de rejet aux salariés
echo    ✅ Notifications au comptable
echo    ✅ Alertes admin
echo.

echo 🔗 Liens utiles:
echo    - Paramètres Google: https://myaccount.google.com
echo    - Render Dashboard: https://dashboard.render.com
echo    - Test API: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.

echo 📚 Documentation:
echo    - GUIDE-MOT-DE-PASSE-APPLICATION.md
echo    - CONFIGURATION-EMAIL.md
echo.

pause
