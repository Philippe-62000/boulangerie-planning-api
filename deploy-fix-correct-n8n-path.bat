@echo off
echo ======================================== CORRECTION CHEMIN CORRECT n8n ========================================
echo [1/3] Correction du chemin SFTP vers n8n/volume1/sick-leaves...
echo ✅ Chemin: n8n/volume1/sick-leaves (chemin relatif correct)
echo ✅ Dossier accessible créé par l'utilisateur dans n8n

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Correction chemin SFTP vers n8n/volume1/sick-leaves (relatif)"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION CHEMIN CORRECT n8n DÉPLOYÉE !

echo 🔧 Correction apportée :
echo 📁 Chemin relatif: n8n/volume1/sick-leaves
echo 📁 Dossier accessible créé par l'utilisateur
echo 📁 L'utilisateur nHEIGHTn devrait avoir des permissions
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload devrait maintenant fonctionner !
pause





