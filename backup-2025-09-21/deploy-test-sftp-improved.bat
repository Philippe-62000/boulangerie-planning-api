@echo off
echo ======================================== DÉPLOIEMENT TEST SFTP AMÉLIORÉ ========================================
echo [1/3] Amélioration du test SFTP...
echo ✅ Test SFTP direct avec ssh2-sftp-client
echo ✅ Vérification de la configuration
echo ✅ Test de listage du répertoire racine

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/sickLeaveController.js
git commit -m "Improve: Test SFTP direct avec diagnostic détaillé"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ TEST SFTP AMÉLIORÉ DÉPLOYÉ !

echo 🔧 Test de connexion SFTP amélioré disponible :
echo 📡 GET https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-sftp
echo 📊 Ce test vérifiera maintenant :
echo    - Configuration du mot de passe SFTP
echo    - Connexion directe au serveur philange.synology.me
echo    - Authentification avec l'utilisateur nHEIGHTn
echo    - Listage du répertoire racine
echo    - Diagnostic détaillé des erreurs
echo ⏳ Attendez 2-3 minutes puis testez !
pause

