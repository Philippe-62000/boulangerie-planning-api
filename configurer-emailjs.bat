@echo off
echo ============================================================
echo 📧 CONFIGURATION EMAILJS - BOULANGERIE PLANNING
echo ============================================================
echo.

echo 🚀 ÉTAPES DE CONFIGURATION :
echo.
echo 1. Créer un compte sur https://www.emailjs.com/
echo 2. Ajouter le service Gmail
echo 3. Créer un template email
echo 4. Configurer les variables sur Render
echo.

echo 📋 VARIABLES À AJOUTER SUR RENDER :
echo.
echo EMAILJS_SERVICE_ID=gmail
echo EMAILJS_TEMPLATE_ID=template_sick_leave
echo EMAILJS_USER_ID=votre_user_id_ici
echo.

echo 🔗 LIENS UTILES :
echo.
echo - EmailJS Dashboard: https://dashboard.emailjs.com/
echo - Email Services: https://dashboard.emailjs.com/admin/integration
echo - Email Templates: https://dashboard.emailjs.com/admin/templates
echo - Account Settings: https://dashboard.emailjs.com/admin/account
echo.

echo ⚠️ IMPORTANT :
echo - Utilisez votre email: arras.boulangerie.ange@gmail.com
echo - Autorisez l'accès à Gmail
echo - Copiez le User ID depuis Account → General
echo.

echo 🎯 TEMPLATE RECOMMANDÉ :
echo.
echo Subject: {{subject}}
echo To: {{to_email}}
echo Message: {{message}}
echo.
echo Variables disponibles:
echo - {{to_email}} : Email du destinataire
echo - {{subject}} : Sujet de l'email
echo - {{message}} : Contenu du message
echo - {{from_name}} : Nom de l'expéditeur
echo - {{from_email}} : Email de l'expéditeur
echo.

echo 📝 Après configuration, testez avec :
echo node test-email-simple.js
echo.

pause
