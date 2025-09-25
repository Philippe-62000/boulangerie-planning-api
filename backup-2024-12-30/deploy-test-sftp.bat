@echo off
echo ======================================== DÉPLOIEMENT TEST SFTP ========================================
echo [1/3] Ajout du test de connexion SFTP...
echo ✅ Test SFTP ajouté au contrôleur
echo ✅ Route /test-sftp ajoutée

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/sickLeaveController.js backend/routes/sickLeaves.js
git commit -m "Add: Test de connexion SFTP pour diagnostic"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ TEST SFTP DÉPLOYÉ !

echo 🔧 Test de connexion SFTP disponible :
echo 📡 GET https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-sftp
echo 📊 Ce test vérifiera :
echo    - Configuration du mot de passe SFTP
echo    - Connexion au serveur philange.synology.me
echo    - Authentification avec l'utilisateur nHEIGHTn
echo ⏳ Attendez 2-3 minutes puis testez !
pause

