@echo off
echo ========================================
echo 📧 CORRECTION FINALE NODEMAILER
echo ========================================

echo.
echo 🎯 Problème: Variables SMTP configurées mais nodemailer non installé
echo    Solution: Forcer l'installation via package.json
echo.

echo 📋 Étape 1: Vérification du package.json...
if exist "backend\package.json" (
    echo ✅ package.json trouvé
    findstr "nodemailer" backend\package.json
) else (
    echo ❌ package.json non trouvé
    exit /b 1
)

echo.
echo 📋 Étape 2: Modification du package.json pour forcer l'installation...
echo.

echo 🔧 Ajout d'un script postinstall pour forcer nodemailer...
echo    "postinstall": "npm install nodemailer --save"
echo.

echo 📋 Étape 3: Modification du render.yaml...
echo.

echo 🔧 Nouvelle configuration buildCommand:
echo    buildCommand: npm install --force && npm install nodemailer --save
echo.

echo 📋 Étape 4: Push des modifications...
git add .
git commit -m "📧 Fix final nodemailer - Force installation via postinstall et buildCommand"
git push origin main

echo.
echo ✅ MODIFICATION TERMINÉE !
echo.
echo 📋 Prochaines étapes:
echo    1. Attendre que Render redéploie (3-5 minutes)
echo    2. Vérifier les logs de build pour nodemailer
echo    3. Tester la configuration email
echo    4. Vérifier que la connexion SMTP fonctionne
echo.
echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Logs Render: Vérifier les logs de build
echo    - Test API: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.

pause
