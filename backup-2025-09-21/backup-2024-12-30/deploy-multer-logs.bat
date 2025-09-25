@echo off
echo ======================================== DÉPLOIEMENT LOGS MULTER ========================================
echo [1/3] Amélioration du middleware Multer...
echo ✅ Logs détaillés avant et après Multer
echo ✅ Gestion d'erreurs spécifique pour Multer
echo ✅ Vérification des headers et content-type
echo ✅ Diagnostic complet du processus d'upload

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/sickLeaveController.js
git commit -m "Add: Logs détaillés pour middleware Multer et diagnostic upload"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ LOGS MULTER DÉPLOYÉS !

echo 🔧 Middleware Multer amélioré :
echo 📊 Logs des headers et content-type
echo 📊 Vérification du body avant Multer
echo 📊 Gestion d'erreurs spécifique Multer
echo 📊 Logs détaillés après traitement Multer
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 📋 Nous verrons maintenant exactement où ça plante dans Multer
pause


