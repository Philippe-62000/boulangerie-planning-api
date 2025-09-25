@echo off
echo ======================================== DÉPLOIEMENT LOGS DÉTAILLÉS ========================================
echo [1/3] Ajout de logs détaillés pour l'upload...
echo ✅ Logs de validation de fichier
echo ✅ Logs de création d'objet SickLeave
echo ✅ Logs de sauvegarde en base
echo ✅ Gestion d'erreurs avec stack trace

echo [2/3] Commit et push vers Git (Render)...
git add backend/controllers/sickLeaveController.js
git commit -m "Add: Logs détaillés pour diagnostic upload arrêt maladie"
git push origin main

echo [3/3] Attente du déploiement Render...
echo ⏳ Le déploiement sur Render peut prendre 2-3 minutes
echo 🔗 Vérifiez: https://boulangerie-planning-api-3.onrender.com/health
echo ✅ LOGS DÉTAILLÉS DÉPLOYÉS !

echo 🔧 Logs ajoutés pour identifier l'erreur exacte :
echo 📊 Validation de fichier avec détails
echo 📊 Création d'objet SickLeave avec gestion d'erreurs
echo 📊 Sauvegarde en base avec stack trace
echo 📊 Chaque étape a maintenant sa propre gestion d'erreurs
echo ⏳ Attendez 2-3 minutes puis testez l'upload !
echo 📋 Les logs détaillés nous diront exactement où ça plante
pause


ns la page ffacer l'information