@echo off
echo ======================================== CORRECTION NOM CHAMP FICHIER ========================================
echo [1/3] Correction du nom du champ fichier...
echo ✅ Changement de 'file' vers 'sickLeaveFile' dans sick-leave-standalone.html
echo ✅ Correspondance avec la configuration Multer
echo ✅ Résolution de l'erreur "Unexpected field"

echo [2/3] Commit et push vers Git (Render)...
git add frontend/public/sick-leave-standalone.html
git commit -m "Fix: Correction nom champ fichier de 'file' vers 'sickLeaveFile' pour Multer"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION CHAMP FICHIER DÉPLOYÉE !

echo 🔧 Problème résolu :
echo 📊 Erreur: MulterError: Unexpected field
echo 📊 Cause: Le JavaScript envoyait 'file' mais Multer attendait 'sickLeaveFile'
echo 📊 Solution: formData.append('sickLeaveFile', fileInput.files[0])
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload d'arrêt maladie devrait maintenant fonctionner !
pause



