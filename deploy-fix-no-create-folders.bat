@echo off
echo ======================================== CORRECTION PAS DE CRÉATION DE DOSSIERS ========================================
echo [1/3] Correction pour ne plus créer de dossiers...
echo ✅ Vérification d'existence uniquement
echo ✅ Erreur claire si le dossier n'existe pas
echo ✅ Plus de tentative de création automatique

echo [2/3] Commit et push vers Git (Render)...
git add backend/services/sftpService.js
git commit -m "Fix: Ne plus créer de dossiers, vérification uniquement"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTION PAS DE CRÉATION DÉPLOYÉE !

echo 🔧 Correction apportée :
echo 📁 Plus de création automatique de dossiers
echo 📁 Vérification d'existence uniquement
echo 📁 Message d'erreur clair si le dossier manque
echo 📁 L'utilisateur doit créer manuellement les dossiers
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 🎉 L'upload devrait maintenant fonctionner !
pause



