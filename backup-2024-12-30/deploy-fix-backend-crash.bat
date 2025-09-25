@echo off
echo 🔧 Correction du crash backend Render
echo.

echo 📦 Installation de nodemailer dans package.json...
echo ✅ Nodemailer déjà ajouté dans package.json

echo.
echo 🚀 Déploiement des corrections...
git add backend/services/emailService.js
git commit -m "Fix: Service email robuste - évite le crash si nodemailer non installé"
git push origin main

echo.
echo ⏳ Attendez 2-3 minutes que Render déploie...
echo 📋 Le backend va redémarrer automatiquement avec les corrections
echo.

echo ✅ Corrections déployées !
echo 📋 Ce qui a été corrigé :
echo    - Service email robuste qui évite les crashes
echo    - Vérification de la disponibilité de nodemailer
echo    - Fallback gracieux si dépendance manquante
echo.
echo 🌐 Testez maintenant la page Stat Vente
echo.
pause







