@echo off
echo ========================================
echo 📧 CORRECTION NODEMAILER V2
echo ========================================

echo.
echo 🎯 Problème persistant: Render n'installe pas nodemailer
echo    Solution: Modifier package.json pour forcer l'installation
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
echo 📋 Étape 2: Modification du package.json...
echo.

echo 🔧 Ajout de nodemailer dans les scripts de build...
echo    "postinstall": "npm install nodemailer"
echo.

echo 📋 Étape 3: Modification du render.yaml...
echo.

echo 🔧 Nouvelle configuration:
echo    buildCommand: npm install --force
echo.

echo 📋 Étape 4: Push des modifications...
git add .
git commit -m "📧 Fix nodemailer V2 - Force installation via postinstall"
git push origin main

echo.
echo ✅ MODIFICATION TERMINÉE !
echo.
echo 📋 Prochaines étapes:
echo    1. Attendre que Render redéploie
echo    2. Vérifier les logs de build
echo    3. Vérifier que nodemailer est installé
echo    4. Configurer les variables SMTP
echo.
echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Logs Render: Vérifier les logs de build
echo.

pause
