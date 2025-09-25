@echo off
echo ========================================
echo 🧪 TEST ENDPOINT TÉLÉCHARGEMENT
echo ========================================
echo.

echo 📋 Test de l'endpoint de téléchargement...
echo.

echo 🔍 Récupération de la liste des arrêts maladie...
curl -s "https://boulangerie-planning-api-3.onrender.com/api/sick-leaves" | findstr "_id"

echo.
echo 📝 Veuillez copier un ID d'arrêt maladie de la liste ci-dessus
echo    et l'utiliser dans la commande suivante :
echo.
echo 💡 Commande de test :
echo    curl -I "https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/[ID]/download"
echo.
echo 🔍 Cette commande testera si l'endpoint répond correctement
echo    sans télécharger le fichier complet.
echo.

echo 📋 Codes de réponse attendus :
echo    - 200 : Fichier trouvé et téléchargement possible
echo    - 404 : Fichier non trouvé
echo    - 500 : Erreur serveur (connexion SFTP, etc.)
echo.

pause
