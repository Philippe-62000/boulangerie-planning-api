@echo off
echo ========================================
echo 📧 CONFIGURATION SERVICE EMAIL
echo ========================================

echo 📋 Étape 1: Vérification des fichiers...
if not exist "backend\services\emailService.js" (
    echo ❌ Fichier emailService.js non trouvé
    exit /b 1
)
echo ✅ Service email trouvé

echo.
echo 📋 Étape 2: Configuration des variables d'environnement...
echo.
echo 🔧 Variables SMTP requises pour Render:
echo    - SMTP_HOST (ex: smtp.gmail.com)
echo    - SMTP_PORT (ex: 587)
echo    - SMTP_USER (votre email d'envoi)
echo    - SMTP_PASS (mot de passe de l'email)
echo.
echo 📝 Pour configurer sur Render:
echo    1. Aller sur https://dashboard.render.com
echo    2. Sélectionner le service "boulangerie-planning-api-3"
echo    3. Aller dans l'onglet "Environment"
echo    4. Ajouter les variables SMTP
echo.

echo 📋 Étape 3: Exemples de configuration...

echo.
echo 🔧 Configuration Gmail:
echo    SMTP_HOST = smtp.gmail.com
echo    SMTP_PORT = 587
echo    SMTP_USER = votre-email@gmail.com
echo    SMTP_PASS = votre-mot-de-passe-app
echo.

echo 🔧 Configuration OVH:
echo    SMTP_HOST = ssl0.ovh.net
echo    SMTP_PORT = 587
echo    SMTP_USER = votre-email@votre-domaine.fr
echo    SMTP_PASS = votre-mot-de-passe
echo.

echo 🔧 Configuration Outlook/Hotmail:
echo    SMTP_HOST = smtp-mail.outlook.com
echo    SMTP_PORT = 587
echo    SMTP_USER = votre-email@outlook.com
echo    SMTP_PASS = votre-mot-de-passe
echo.

echo 📋 Étape 4: Push des modifications...
git add .
git commit -m "📧 Configuration service email - Variables SMTP requises sur Render"
git push origin main

echo.
echo ✅ CONFIGURATION TERMINÉE !
echo.
echo 📋 Prochaines étapes:
echo    1. Configurer les variables SMTP sur Render
echo    2. Redémarrer le service Render
echo    3. Tester l'envoi d'email
echo.
echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Service API: boulangerie-planning-api-3
echo    - Test email: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.
pause
