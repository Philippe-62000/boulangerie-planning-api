@echo off
echo ======================================== AJOUT DÉPENDANCES MANQUANTES ========================================
echo [1/3] Ajout des dépendances manquantes...
echo ✅ multer: Upload de fichiers
echo ✅ ssh2-sftp-client: Connexion SFTP
echo ✅ sharp: Traitement d'images
echo ✅ pdf-parse: Traitement de PDF

echo [2/3] Commit et push vers Git (Render)...
git add backend/package.json
git commit -m "Add: Dépendances manquantes pour upload arrêts maladie (multer, ssh2-sftp-client, sharp, pdf-parse)"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 3-5 minutes (installation des dépendances)
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ DÉPENDANCES AJOUTÉES !

echo 🔧 Dépendances ajoutées :
echo 📦 multer: Gestion upload de fichiers
echo 📦 ssh2-sftp-client: Connexion SFTP vers NAS
echo 📦 sharp: Validation et traitement d'images
echo 📦 pdf-parse: Validation et extraction texte PDF
echo ⏳ Attendez 3-5 minutes puis testez l'upload d'arrêt maladie !
pause


