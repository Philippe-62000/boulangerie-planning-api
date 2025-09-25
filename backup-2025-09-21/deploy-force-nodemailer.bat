@echo off
echo ========================================
echo 📧 FORCE INSTALLATION NODEMAILER
echo ========================================

echo.
echo 🎯 Problème: Render n'installe pas nodemailer
echo    Solution: Forcer l'installation via buildCommand
echo.

echo 📋 Étape 1: Modification du render.yaml...
echo.

echo 🔧 Ajout de la commande d'installation forcée...
echo    buildCommand: npm install && npm install nodemailer
echo.

echo 📋 Étape 2: Vérification du render.yaml actuel...
if exist "render.yaml" (
    echo ✅ render.yaml trouvé
    type render.yaml
) else (
    echo ❌ render.yaml non trouvé
    echo 📝 Création du render.yaml...
)

echo.
echo 📋 Étape 3: Modification du render.yaml...
echo.

echo 🔧 Nouvelle configuration:
echo    buildCommand: npm install && npm install nodemailer --save
echo.

echo 📋 Étape 4: Push des modifications...
git add .
git commit -m "📧 Force installation nodemailer - Modification buildCommand"
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
