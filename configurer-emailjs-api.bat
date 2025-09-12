@echo off
echo ============================================================
echo 🔧 CONFIGURATION EMAILJS API - CORRECTION ERROR 403
echo ============================================================
echo.

echo ❌ Erreur détectée: "API calls are disabled for non-browser applications"
echo.
echo 🔍 CAUSE :
echo L'API EmailJS est désactivée pour les applications non-browser
echo.

echo 🚀 SOLUTIONS :
echo.
echo 1. ACTIVER L'API SUR EMAILJS :
echo    - Aller sur: https://dashboard.emailjs.com/admin/account
echo    - Chercher la section "API Settings" ou "Security"
echo    - Activer "Allow API calls from non-browser applications"
echo    - Sauvegarder les modifications
echo.

echo 2. ALTERNATIVE - VÉRIFIER LES PERMISSIONS :
echo    - Aller sur: https://dashboard.emailjs.com/admin/account
echo    - Vérifier que l'API est activée
echo    - Vérifier les domaines autorisés
echo.

echo 3. TESTER APRÈS CONFIGURATION :
echo    - node test-emailjs-direct.js
echo    - node test-email-simple.js
echo.

echo 🔗 LIENS DIRECTS :
echo.
echo - EmailJS Account: https://dashboard.emailjs.com/admin/account
echo - EmailJS Services: https://dashboard.emailjs.com/admin/integration
echo - EmailJS Templates: https://dashboard.emailjs.com/admin/templates
echo.

echo ⚠️ IMPORTANT :
echo - L'API doit être activée pour les applications non-browser
echo - Le service Gmail doit être configuré
echo - Le template doit exister
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
