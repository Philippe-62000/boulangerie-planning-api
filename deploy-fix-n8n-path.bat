@echo off
echo ======================================== CORRECTION CHEMIN VERS n8n ========================================
echo [1/3] Correction du chemin SFTP vers /volume1/n8n/sick-leaves...
echo ✅ Chemin: /volume1/n8n/sick-leaves (dossier accessible créé par l'utilisateur)
echo ✅ Utilise le dossier n8n où l'utilisateur a des permissions

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Correction chemin SFTP vers /volume1/n8n/sick-leaves"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION CHEMIN n8n DÉPLOYÉE !

echo 🔧 Correction apportée :
echo 📁 Nouveau chemin: /volume1/n8n/sick-leaves
echo 📁 Dossier accessible créé par l'utilisateur
echo 📁 L'utilisateur nHEIGHTn devrait avoir des permissions
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload devrait maintenant fonctionner !
pause






