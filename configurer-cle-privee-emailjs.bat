@echo off
echo ============================================================
echo 🔑 CONFIGURATION CLÉ PRIVÉE EMAILJS
echo ============================================================
echo.

echo ❌ Erreur détectée: "API calls in strict mode, but no private key was passed"
echo.
echo 🔍 CAUSE :
echo Il faut ajouter la clé privée EmailJS pour les appels API
echo.

echo 🚀 SOLUTION :
echo.
echo 1. AJOUTER LA CLÉ PRIVÉE SUR RENDER :
echo    - Aller sur: https://dashboard.render.com/
echo    - Sélectionner: boulangerie-planning-api-3
echo    - Environment → Environment Variables
echo    - Ajouter cette variable:
echo      EMAILJS_PRIVATE_KEY = jKt0•••••••••••••••••
echo.
echo 2. VARIABLES COMPLÈTES À AVOIR :
echo    EMAILJS_SERVICE_ID = gmail
echo    EMAILJS_TEMPLATE_ID = template_sick_leave
echo    EMAILJS_USER_ID = EHw0fFSAwQ_4SfY6Z
echo    EMAILJS_PRIVATE_KEY = jKt0•••••••••••••••••
echo.

echo 3. REDÉMARRER LE SERVICE :
echo    - Sur Render: Manual Deploy → Deploy latest commit
echo.

echo 4. TESTER :
echo    - node test-emailjs-direct.js
echo    - node test-email-simple.js
echo.

echo 🔗 LIENS DIRECTS :
echo.
echo - Render Dashboard: https://dashboard.render.com/
echo - EmailJS Account: https://dashboard.emailjs.com/admin/account
echo.

echo ⚠️ IMPORTANT :
echo - Utilisez la clé privée complète: jKt0•••••••••••••••••
echo - Toutes les 4 variables doivent être configurées
echo - Redémarrez le service après configuration
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
