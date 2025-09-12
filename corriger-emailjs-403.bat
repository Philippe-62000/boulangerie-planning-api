@echo off
echo ============================================================
echo 🔧 CORRECTION EMAILJS ERROR 403
echo ============================================================
echo.

echo ❌ Erreur détectée: EmailJS error: 403
echo.
echo 🔍 CAUSES POSSIBLES :
echo.
echo 1. Service Gmail non configuré
echo 2. Template non créé
echo 3. Variables d'environnement incorrectes
echo 4. Permissions insuffisantes
echo.

echo 🚀 SOLUTIONS :
echo.
echo 1. VÉRIFIER LE SERVICE GMAIL :
echo    - Aller sur https://dashboard.emailjs.com/admin/integration
echo    - S'assurer qu'un service Gmail existe
echo    - Service ID doit être: gmail
echo.
echo 2. VÉRIFIER LE TEMPLATE :
echo    - Aller sur https://dashboard.emailjs.com/admin/templates
echo    - S'assurer qu'un template existe
echo    - Template ID doit être: template_sick_leave
echo.
echo 3. VÉRIFIER LES VARIABLES RENDER :
echo    - EMAILJS_SERVICE_ID=gmail
echo    - EMAILJS_TEMPLATE_ID=template_sick_leave
echo    - EMAILJS_USER_ID=EHw0fFSAwQ_4SfY6Z
echo.
echo 4. REDÉMARRER LE SERVICE :
echo    - Sur Render: Manual Deploy
echo.
echo 🔗 LIENS DIRECTS :
echo.
echo - EmailJS Services: https://dashboard.emailjs.com/admin/integration
echo - EmailJS Templates: https://dashboard.emailjs.com/admin/templates
echo - Render Dashboard: https://dashboard.render.com/
echo.

echo ⚠️ IMPORTANT :
echo - Le service Gmail doit être connecté avec arras.boulangerie.ange@gmail.com
echo - Le template doit utiliser les variables {{to_email}}, {{subject}}, {{message}}
echo - Toutes les variables doivent être exactement comme indiqué
echo.

echo 📝 Après correction, testez avec :
echo node test-email-simple.js
echo.

pause
