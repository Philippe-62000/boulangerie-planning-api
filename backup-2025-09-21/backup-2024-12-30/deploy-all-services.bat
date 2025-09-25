@echo off
echo 🚀 Déploiement complet - Tous les services mis à jour
echo.

echo 📝 Commit des modifications...
git add .
git commit -m "Update: URLs vers nouveaux services Render (API-4, Python services)"

echo.
echo 🔄 Push vers GitHub...
git push origin main

echo.
echo ✅ Déploiement automatique déclenché sur Render !
echo.
echo 📋 Services configurés :
echo    - API Node.js: https://boulangerie-planning-api-4-pbfy.onrender.com
echo    - Constraint Calculator: https://constraint-calculator-pbfy.onrender.com  
echo    - Planning Generator: https://planning-generator-pbfy.onrender.com
echo.
echo 🔧 Configuration SMTP nécessaire sur Render :
echo    - SMTP_HOST=smtp.gmail.com
echo    - SMTP_PORT=587
echo    - SMTP_USER=votre-email@gmail.com
echo    - SMTP_PASS=mot-de-passe-application-gmail
echo.
echo 📱 Frontend à redéployer sur OVH après tests
echo.
pause
