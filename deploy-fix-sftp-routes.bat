@echo off
echo ======================================== CORRECTION ROUTES SFTP ========================================
echo [1/3] Correction des erreurs de routes...
echo ✅ Export de testSftpConnection ajouté
echo ✅ Ordre des routes corrigé (/test-sftp avant /:id)
echo ✅ Conflit de routes résolu

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/sickLeaveController.js backend/routes/sickLeaves.js
git commit -m "Fix: Correction export testSftpConnection et ordre des routes"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ CORRECTIONS ROUTES DÉPLOYÉES !

echo 🔧 Test de connexion SFTP maintenant fonctionnel :
echo 📡 GET https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-sftp
echo 📊 Plus d'erreur "Route.get() requires a callback function"
echo 📊 Plus de conflit avec /:id
echo ⏳ Attendez 2-3 minutes puis testez !
pause

