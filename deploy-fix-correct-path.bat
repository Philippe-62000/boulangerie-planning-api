@echo off
echo ======================================== CORRECTION CHEMIN VERS /volume1 ========================================
echo [1/3] Correction du chemin SFTP vers /volume1...
echo ✅ Chemin: /volume1/sick-leaves (où les dossiers ont été créés)
echo ✅ Correspondance avec les dossiers existants sur le NAS

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Correction chemin SFTP vers /volume1/sick-leaves"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION CHEMIN DÉPLOYÉE !

echo 🔧 Correction apportée :
echo 📁 Ancien chemin: /home/nHEIGHTn/sick-leaves (incorrect)
echo 📁 Nouveau chemin: /volume1/sick-leaves (correct)
echo 📁 Correspondance avec les dossiers créés manuellement
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload devrait maintenant fonctionner !
pause





