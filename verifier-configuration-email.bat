@echo off
echo ========================================
echo 🔍 VÉRIFICATION CONFIGURATION EMAIL
echo ========================================

echo.
echo 🎯 Ce script vérifie si le service email est configuré
echo    et vous guide pour résoudre le problème.
echo.

echo 📋 Étape 1: Test de l'API...
echo.

echo 🔍 Test de la configuration email via l'API...
curl -s "https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email" > temp_email_test.json

if exist temp_email_test.json (
    echo ✅ Réponse reçue de l'API
    echo.
    echo 📊 Contenu de la réponse:
    type temp_email_test.json
    echo.
    del temp_email_test.json
) else (
    echo ❌ Impossible de contacter l'API
    echo    Vérifiez que le service Render est en ligne
)

echo.
echo 📋 Étape 2: Vérification des variables d'environnement...
echo.

echo 🔍 Variables SMTP requises sur Render:
echo    ✅ SMTP_HOST (ex: smtp.gmail.com)
echo    ✅ SMTP_PORT (ex: 587)
echo    ✅ SMTP_USER (votre email Gmail)
echo    ✅ SMTP_PASS (mot de passe d'application)
echo.

echo 📋 Étape 3: Instructions pour configurer sur Render...
echo.

echo 🚀 Aller sur Render Dashboard:
echo    1. https://dashboard.render.com
echo    2. Se connecter à votre compte
echo    3. Sélectionner "boulangerie-planning-api-3"
echo    4. Cliquer sur l'onglet "Environment"
echo    5. Ajouter les 4 variables SMTP
echo.

echo 🔧 Variables à ajouter:
echo    SMTP_HOST = smtp.gmail.com
echo    SMTP_PORT = 587
echo    SMTP_USER = philangenpdc@gmail.com
echo    SMTP_PASS = [votre mot de passe d'application]
echo.

echo ⚠️  IMPORTANT:
echo    - Le mot de passe d'application doit être SANS ESPACES
echo    - Sauvegarder les changements
echo    - Redémarrer le service
echo.

echo 📋 Étape 4: Test après configuration...
echo.

echo 🧪 Après avoir configuré les variables:
echo    1. Attendre que le service redémarre
echo    2. Relancer ce script pour vérifier
echo    3. Ou tester directement: node test-email-config.js
echo.

echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Test API: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo    - Guide complet: CONFIGURATION-EMAIL.md
echo.

pause
