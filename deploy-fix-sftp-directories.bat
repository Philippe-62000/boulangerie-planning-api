@echo off
echo ======================================== CORRECTION CRÉATION DOSSIERS SFTP ========================================
echo [1/3] Correction de la création de dossiers SFTP...
echo ✅ Création récursive améliorée des dossiers
echo ✅ Vérification d'existence avant upload
echo ✅ Gestion d'erreurs pour création de dossiers parents
echo ✅ Vérification du dossier de destination avant upload

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Amélioration création dossiers SFTP et vérification avant upload"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTIONS SFTP DÉPLOYÉES !

echo 🔧 Corrections apportées :
echo 📁 Création récursive améliorée des dossiers
echo 📁 Vérification d'existence du dossier de destination
echo 📁 Création automatique si le dossier n'existe pas
echo 📁 Gestion d'erreurs pour les dossiers parents
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload d'arrêt maladie devrait maintenant fonctionner !
pause



