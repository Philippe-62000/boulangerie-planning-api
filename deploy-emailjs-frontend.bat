@echo off
echo 📧 Déploiement EmailJS Frontend...
echo.

echo 📝 Modifications appliquées :
echo   - ✅ EmployeeModal.js utilise maintenant EmailJS
echo   - ✅ Employees.js utilise maintenant EmailJS
echo   - ✅ Plus de dépendance sur l'API backend
echo   - ✅ Emails réels via EmailJS
echo.

echo 📝 Commit des modifications...
git add frontend/src/components/EmployeeModal.js
git add frontend/src/pages/Employees.js
git commit -m "EmailJS: Utiliser EmailJS pour l'envoi de mot de passe au lieu de l'API backend"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo 📦 Build du frontend...
cd frontend
call npm run build

echo.
echo 📁 Création de l'archive...
cd ..
powershell -Command "Compress-Archive -Path 'frontend/build/*' -DestinationPath 'frontend-emailjs.zip' -Force"

echo.
echo ✅ FRONTEND EMAILJS PRÊT !
echo.
echo 📋 ÉTAPES SUIVANTES :
echo.
echo 1. 🎯 CRÉER LE TEMPLATE EMAILJS :
echo    - Aller sur: https://dashboard.emailjs.com/admin/templates
echo    - Créer un nouveau template nommé "template_password"
echo    - Variables disponibles: {{to_name}}, {{to_email}}, {{temp_password}}, {{login_url}}
echo.
echo 2. 📤 UPLOAD SUR OVH :
echo    - Extraire frontend-emailjs.zip
echo    - Uploader dans /plan/ sur OVH
echo.
echo 3. 🧪 TESTER :
echo    - Aller sur www.filmara.fr/plan
echo    - Gestion des employés
echo    - Envoyer mot de passe
echo    - Vérifier la réception de l'email
echo.
echo 📧 TEMPLATE EMAILJS SUGGÉRÉ :
echo.
echo Sujet: Mot de passe temporaire - {{to_name}}
echo.
echo Contenu:
echo Bonjour {{to_name}},
echo.
echo Voici votre mot de passe temporaire : {{temp_password}}
echo.
echo Pour vous connecter, allez sur : {{login_url}}
echo.
echo Cordialement,
echo L'équipe Boulangerie
echo.
pause


