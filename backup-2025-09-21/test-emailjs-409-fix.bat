@echo off
echo ============================================================
echo 🔧 CORRECTION EMAILJS ERROR 409
echo ============================================================
echo.

echo ❌ Erreur détectée: 409 "The service isn't added"
echo.
echo 🔍 CAUSE :
echo Le service Gmail n'existe pas sur EmailJS
echo.

echo 🚀 SOLUTION :
echo.
echo 1. CRÉER LE SERVICE GMAIL :
echo    - Aller sur: https://dashboard.emailjs.com/admin/integration
echo    - Cliquer sur "Add New Service"
echo    - Choisir "Gmail" dans la liste
echo    - Service ID: gmail (exactement)
echo    - Connecter avec: arras.boulangerie.ange@gmail.com
echo    - Autoriser l'accès à Gmail
echo    - Sauvegarder
echo.

echo 2. VÉRIFIER LES PERMISSIONS GMAIL :
echo    - 2-Step Verification activé
echo    - App Password généré
echo    - Less secure app access autorisé
echo.

echo 🔗 LIENS DIRECTS :
echo.
echo - EmailJS Services: https://dashboard.emailjs.com/admin/integration
echo - Gmail Security: https://myaccount.google.com/security
echo - App Passwords: https://myaccount.google.com/apppasswords
echo.

echo ⚠️ IMPORTANT :
echo - Service ID doit être exactement: gmail
echo - Connecter avec: arras.boulangerie.ange@gmail.com
echo - Autoriser toutes les permissions demandées
echo.

echo 📝 Après création, testez avec :
echo node test-emailjs-direct.js
echo.

echo 🎯 RÉSULTAT ATTENDU :
echo ✅ Status Code: 200
echo ✅ Email envoyé avec succès
echo ✅ Plus d'erreur 409
echo.

pause
