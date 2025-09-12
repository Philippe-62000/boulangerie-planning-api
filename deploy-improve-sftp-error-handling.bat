@echo off
echo ======================================== AMÉLIORATION GESTION ERREURS SFTP ========================================
echo [1/3] Amélioration de la gestion des erreurs SFTP...
echo ✅ Vérification d'existence avant création
echo ✅ Chemin relatif avec ./
echo ✅ Gestion d'erreurs détaillée avec codes
echo ✅ Continuation malgré les erreurs de création

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Improve: Gestion d'erreurs SFTP améliorée et vérification d'existence"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ AMÉLIORATIONS SFTP DÉPLOYÉES !

echo 🔧 Améliorations apportées :
echo 📁 Vérification d'existence avec stat() avant mkdir()
echo 📁 Chemin relatif: ./sick-leaves
echo 📁 Gestion d'erreurs détaillée avec codes d'erreur
echo 📁 Continuation du processus même en cas d'erreur
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload devrait maintenant être plus robuste !
pause



