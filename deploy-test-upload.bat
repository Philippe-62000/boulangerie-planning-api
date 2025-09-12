@echo off
echo ======================================== DÉPLOIEMENT TEST UPLOAD ========================================
echo [1/3] Ajout du test d'upload...
echo ✅ Test d'upload simple sans fichier
echo ✅ Vérification des dépendances
echo ✅ Logs détaillés pour diagnostic

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/sickLeaveController.js backend/routes/sickLeaves.js
git commit -m "Add: Test d'upload simple pour diagnostic des dépendances"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ TEST UPLOAD DÉPLOYÉ !

echo 🔧 Tests disponibles :
echo 📡 GET https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-sftp
echo 📡 GET https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-upload
echo 📊 Le test upload vérifiera :
echo    - Disponibilité des dépendances (multer, sharp, pdf-parse, ssh2-sftp-client)
echo    - Configuration du mot de passe SFTP
echo    - État général du système
echo ⏳ Attendez 2-3 minutes puis testez !
pause


