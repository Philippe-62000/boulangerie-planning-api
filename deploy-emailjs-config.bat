@echo off
echo ============================================================
echo 📧 DÉPLOIEMENT CONFIGURATION EMAILJS
echo ============================================================
echo.

echo 🔑 Clés EmailJS identifiées :
echo Public Key: EHw0fFSAwQ_4SfY6Z
echo Private Key: jKt0•••••••••••••••••
echo.

echo 📋 Variables à ajouter sur Render :
echo.
echo EMAILJS_SERVICE_ID=gmail
echo EMAILJS_TEMPLATE_ID=template_sick_leave
echo EMAILJS_USER_ID=EHw0fFSAwQ_4SfY6Z
echo.

echo 🚀 Étapes suivantes :
echo.
echo 1. Aller sur Render Dashboard
echo 2. Sélectionner boulangerie-planning-api-3
echo 3. Environment Variables
echo 4. Ajouter les 3 variables ci-dessus
echo 5. Redémarrer le service
echo.

echo 🔗 Liens directs :
echo.
echo - Render Dashboard: https://dashboard.render.com/
echo - EmailJS Dashboard: https://dashboard.emailjs.com/
echo - Email Services: https://dashboard.emailjs.com/admin/integration
echo - Email Templates: https://dashboard.emailjs.com/admin/templates
echo.

echo ⚠️ IMPORTANT :
echo - Service ID: gmail
echo - Template ID: template_sick_leave
echo - User ID: EHw0fFSAwQ_4SfY6Z
echo.

echo 📝 Après configuration, testez avec :
echo node test-email-simple.js
echo.

echo 🎯 Résultat attendu :
echo ✅ Service email alternatif configuré
echo ✅ EmailJS disponible
echo ✅ Emails envoyés avec succès
echo.

pause
