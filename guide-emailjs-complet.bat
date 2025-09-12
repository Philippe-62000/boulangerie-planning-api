@echo off
echo ============================================================
echo 📧 GUIDE COMPLET EMAILJS - CORRECTION ERROR 403
echo ============================================================
echo.

echo 🔧 ÉTAPES DE CORRECTION :
echo.

echo 1. CONFIGURER LE SERVICE GMAIL :
echo    - Aller sur: https://dashboard.emailjs.com/admin/integration
echo    - Cliquer sur "Add New Service"
echo    - Choisir "Gmail"
echo    - Service ID: gmail (exactement)
echo    - Connecter avec: arras.boulangerie.ange@gmail.com
echo    - Autoriser l'accès
echo.

echo 2. CRÉER LE TEMPLATE EMAIL :
echo    - Aller sur: https://dashboard.emailjs.com/admin/templates
echo    - Cliquer sur "Create New Template"
echo    - Template ID: template_sick_leave (exactement)
echo    - Contenu:
echo      Subject: {{subject}}
echo      To: {{to_email}}
echo      {{message}}
echo      ---
echo      Boulangerie Ange - Arras
echo.

echo 3. VÉRIFIER LES VARIABLES RENDER :
echo    - Aller sur: https://dashboard.render.com/
echo    - Sélectionner: boulangerie-planning-api-3
echo    - Environment → Environment Variables
echo    - Vérifier ces 3 variables:
echo      EMAILJS_SERVICE_ID = gmail
echo      EMAILJS_TEMPLATE_ID = template_sick_leave
echo      EMAILJS_USER_ID = EHw0fFSAwQ_4SfY6Z
echo.

echo 4. REDÉMARRER LE SERVICE :
echo    - Sur Render: Manual Deploy → Deploy latest commit
echo.

echo 5. TESTER :
echo    - node test-emailjs-direct.js
echo    - node test-email-simple.js
echo.

echo 🔗 LIENS DIRECTS :
echo.
echo - EmailJS Services: https://dashboard.emailjs.com/admin/integration
echo - EmailJS Templates: https://dashboard.emailjs.com/admin/templates
echo - Render Dashboard: https://dashboard.render.com/
echo.

echo ⚠️ IMPORTANT :
echo - Service ID doit être exactement: gmail
echo - Template ID doit être exactement: template_sick_leave
echo - User ID doit être exactement: EHw0fFSAwQ_4SfY6Z
echo - Le service Gmail doit être connecté et autorisé
echo.

echo 📝 Après configuration, testez avec :
echo node test-emailjs-direct.js
echo.

echo 🎯 RÉSULTAT ATTENDU :
echo ✅ Status Code: 200
echo ✅ Email envoyé avec succès
echo ✅ Plus d'erreur 403
echo.

pause
