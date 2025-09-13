@echo off
echo ======================================== CORRECTION CHEMIN VOLUME SFTP ========================================
echo [1/3] Correction du chemin SFTP vers /volume1...
echo ✅ Chemin: /volume1/sick-leaves (chemin Synology standard)
echo ✅ Vérification d'existence sans création automatique
echo ✅ L'utilisateur doit créer les dossiers manuellement

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Chemin SFTP vers /volume1 et vérification sans création automatique"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION CHEMIN VOLUME DÉPLOYÉE !

echo 🔧 Corrections apportées :
echo 📁 Nouveau chemin: /volume1/sick-leaves
echo 📁 Vérification d'existence sans création automatique
echo 📁 L'utilisateur doit créer manuellement:
echo    - /volume1/sick-leaves
echo    - /volume1/sick-leaves/2025
echo    - /volume1/sick-leaves/2025/09-septembre
echo    - /volume1/sick-leaves/pending
echo    - /volume1/sick-leaves/validated
echo    - /volume1/sick-leaves/declared
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
pause




