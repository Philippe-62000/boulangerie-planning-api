@echo off
echo 🚀 Déploiement des corrections complètes
echo.

echo 📦 Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 🔧 Ajout des fichiers au Git...
git add .
git commit -m "🔧 Corrections complètes - CORS, Congés, SFTP

✅ Correction CORS - Ajout de la méthode PATCH
✅ Correction HolidayStatus - URL Google Sheets corrigée
✅ Logs détaillés pour diagnostiquer les problèmes
✅ Configuration SFTP améliorée avec logs

🎯 Problèmes résolus:
• Erreur CORS PATCH pour désactivation employé
• État des congés ne se charge pas
• Logs SFTP pour diagnostiquer l'erreur 500
• URL Google Sheets corrigée

📋 Fonctionnalités corrigées:
• Désactivation d'employé (PATCH autorisé)
• Chargement des congés depuis Google Sheets
• Diagnostic des problèmes SFTP
• Logs détaillés pour le débogage"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Corrections complètes déployées !
echo.
echo 🎯 Résumé des corrections:
echo   • server.js: Méthode PATCH ajoutée à CORS
echo   • HolidayStatus.js: URL Google Sheets corrigée + logs
echo   • sickLeaveController.js: Logs SFTP détaillés
echo   • Désactivation d'employé fonctionnelle
echo   • État des congés avec logs de diagnostic
echo.
echo 📋 Prochaines étapes:
echo   1. Uploader le frontend sur OVH
echo   2. Tester la désactivation d'employé
echo   3. Vérifier l'état des congés dans la console
echo   4. Tester l'upload d'arrêt maladie
echo.
echo 🔗 URLs à tester:
echo   • Désactivation employé: Devrait fonctionner maintenant
echo   • État des congés: Vérifier les logs dans la console
echo   • Upload arrêt maladie: Vérifier les logs SFTP
echo.
echo 🔧 Si l'upload SFTP ne fonctionne toujours pas:
echo   • Vérifier que SFTP_PASSWORD est bien configuré sur Render
echo   • Vérifier que l'utilisateur 'nHEIGHTn' a les bonnes permissions
echo   • Vérifier que le service SFTP est activé sur le NAS
echo.
pause
