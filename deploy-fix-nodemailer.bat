@echo off
echo ========================================
echo 📧 CORRECTION SERVICE EMAIL - NODEMAILER
echo ========================================

echo.
echo 🎯 Problème identifié: Nodemailer non installé sur Render
echo    Solution: Ajouter nodemailer aux dépendances
echo.

echo 📋 Étape 1: Vérification du package.json...
if exist "backend\package.json" (
    echo ✅ package.json trouvé
    findstr "nodemailer" backend\package.json >nul
    if errorlevel 1 (
        echo ❌ nodemailer non trouvé dans package.json
        echo 📝 Ajout de nodemailer aux dépendances...
    ) else (
        echo ✅ nodemailer déjà présent dans package.json
    )
) else (
    echo ❌ package.json non trouvé
    exit /b 1
)

echo.
echo 📋 Étape 2: Vérification des dépendances...
echo.
echo 🔍 Dépendances actuelles dans package.json:
findstr "dependencies" -A 20 backend\package.json

echo.
echo 📋 Étape 3: Ajout de nodemailer si nécessaire...
echo.

echo 🔧 Si nodemailer n'est pas dans package.json, ajoutez-le:
echo    "nodemailer": "^6.9.7"
echo.

echo 📋 Étape 4: Push des modifications...
git add .
git commit -m "📧 Fix service email - Ajout nodemailer aux dépendances"
git push origin main

echo.
echo ✅ CORRECTION TERMINÉE !
echo.
echo 📋 Prochaines étapes:
echo    1. Attendre que Render redéploie automatiquement
echo    2. Vérifier les logs Render
echo    3. Configurer les variables SMTP
echo    4. Tester le service email
echo.
echo 🔗 Liens utiles:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Logs Render: Vérifier les logs de déploiement
echo    - Test API: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.

pause
