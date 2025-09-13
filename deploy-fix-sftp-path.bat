@echo off
echo ======================================== CORRECTION CHEMIN SFTP ========================================
echo [1/3] Correction du chemin SFTP...
echo ✅ Changement vers chemin relatif: 'sick-leaves'
echo ✅ Évite les problèmes de permissions sur la racine
echo ✅ Utilise le répertoire de connexion de l'utilisateur

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Changement chemin SFTP vers relatif pour éviter permissions"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION CHEMIN SFTP DÉPLOYÉE !

echo 🔧 Correction apportée :
echo 📁 Ancien chemin: /sick-leaves (permissions refusées)
echo 📁 Nouveau chemin: sick-leaves (relatif au répertoire de connexion)
echo 📁 L'utilisateur nHEIGHTn aura les permissions dans son répertoire
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload devrait maintenant fonctionner !
pause





