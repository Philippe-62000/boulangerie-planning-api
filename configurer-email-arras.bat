@echo off
echo ========================================
echo 📧 CONFIGURATION EMAIL ARRAS BOULANGERIE
echo ========================================

echo.
echo 🎯 Configuration pour l'email: arras.boulangerie.ange@gmail.com
echo    avec le mot de passe d'application Gmail
echo.

echo 📋 Étape 1: Vérification de la configuration actuelle...
echo.

echo 🔍 Test de l'API actuelle...
curl -s "https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email" > temp_test.json 2>nul

if exist temp_test.json (
    echo ✅ Réponse reçue de l'API
    type temp_test.json
    del temp_test.json
) else (
    echo ❌ Impossible de contacter l'API
)

echo.
echo 📋 Étape 2: Configuration sur Render...
echo.

echo 🚀 Aller sur Render Dashboard:
echo    1. https://dashboard.render.com
echo    2. Se connecter à votre compte
echo    3. Sélectionner "boulangerie-planning-api-3"
echo    4. Cliquer sur l'onglet "Environment"
echo    5. Ajouter/modifier ces 4 variables:
echo.

echo 🔧 Variables SMTP à configurer:
echo    SMTP_HOST = smtp.gmail.com
echo    SMTP_PORT = 587
echo    SMTP_USER = arras.boulangerie.ange@gmail.com
echo    SMTP_PASS = [votre mot de passe d'application Gmail]
echo.

echo ⚠️  IMPORTANT:
echo    - Utiliser le mot de passe d'application SANS ESPACES
echo    - Email: arras.boulangerie.ange@gmail.com
echo    - Sauvegarder les changements
echo    - Redémarrer le service
echo.

echo 📋 Étape 3: Test après configuration...
echo.

echo 🧪 Après avoir configuré les variables:
echo    1. Attendre que le service redémarre (2-3 minutes)
echo    2. Relancer ce script pour vérifier
echo    3. Ou tester directement: node test-email-config.js
echo.

echo 📋 Étape 4: Vérification des logs Render...
echo.

echo 🔍 Dans les logs Render, vous devriez voir:
echo    ✅ Service email configuré
echo    ✅ Connexion SMTP vérifiée
echo.
echo    Au lieu de:
echo    ⚠️ Service email non configuré - email non envoyé
echo.

echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Test API: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo    - Guide complet: CONFIGURATION-EMAIL.md
echo.

echo 📧 Email configuré: arras.boulangerie.ange@gmail.com
echo 🔑 Mot de passe: [votre mot de passe d'application Gmail]
echo.

pause
