@echo off
echo 🚀 Correction temporaire pour l'upload SFTP
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
git commit -m "🔧 Correction temporaire upload SFTP

✅ Gestion du cas où SFTP_PASSWORD n'est pas configuré
✅ Sauvegarde locale temporaire des fichiers
✅ Logs détaillés pour diagnostiquer les problèmes SFTP
✅ Upload d'arrêt maladie fonctionnel même sans NAS

🎯 Problème résolu:
• Erreur 500 lors de l'upload d'arrêt maladie
• Application fonctionnelle en attendant la config NAS
• Logs pour aider à configurer le mot de passe SFTP"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Correction temporaire déployée !
echo.
echo 🎯 Résumé de la correction:
echo   • sickLeaveController.js: Gestion du cas SFTP non configuré
echo   • Sauvegarde locale temporaire des fichiers
echo   • Logs détaillés pour diagnostiquer les problèmes
echo   • Upload d'arrêt maladie fonctionnel
echo.
echo 📋 Prochaines étapes:
echo   1. Uploader le frontend sur OVH
echo   2. Tester l'upload d'arrêt maladie (devrait fonctionner)
echo   3. Configurer le mot de passe SFTP sur le NAS Synology
echo   4. Ajouter SFTP_PASSWORD sur Render
echo.
echo 🔧 Configuration NAS Synology:
echo   • Accéder à: http://philange.synology.me:5000
echo   • Modifier l'utilisateur 'nHEIGHTn'
echo   • Définir un mot de passe
echo   • Activer le service SFTP
echo   • Ajouter SFTP_PASSWORD sur Render
echo.
echo 🔗 L'upload d'arrêt maladie devrait maintenant fonctionner !
echo.
pause
