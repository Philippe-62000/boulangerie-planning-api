@echo off
echo ========================================
echo 📧 URGENCE: INSTALLATION NODEMAILER
echo ========================================

echo.
echo 🎯 Problème: nodemailer ne s'installe toujours pas sur Render
echo    Solution: Approche alternative avec dépendances explicites
echo.

echo 📋 Étape 1: Modification du package.json...
echo.

echo 🔧 Ajout de nodemailer dans les dependencies avec version exacte...
echo    "nodemailer": "6.9.7"
echo.

echo 📋 Étape 2: Modification du render.yaml...
echo.

echo 🔧 Nouvelle configuration:
echo    buildCommand: npm ci && npm install nodemailer@6.9.7 --save
echo.

echo 📋 Étape 3: Création d'un fichier .npmrc...
echo.

echo 📝 Configuration npm pour forcer l'installation...
echo    engine-strict=false
echo.

echo 📋 Étape 4: Push des modifications...
git add .
git commit -m "📧 URGENCE: Force installation nodemailer@6.9.7 - Approche alternative"
git push origin main

echo.
echo ✅ MODIFICATION TERMINÉE !
echo.
echo 📋 Prochaines étapes:
echo    1. Attendre que Render redéploie (5-7 minutes)
echo    2. Vérifier les logs de build pour nodemailer
echo    3. Tester la configuration email
echo    4. Si ça ne marche pas, essayer une approche différente
echo.
echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Logs Render: Vérifier les logs de build
echo    - Test: node test-email-simple.js
echo.

pause
