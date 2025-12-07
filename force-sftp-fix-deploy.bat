@echo off
echo ========================================
echo   FORCER REDEPLOIEMENT - CORRECTIONS SFTP
echo ========================================
echo.

echo 🔍 Vérification des fichiers modifiés...
git status --short

echo.
echo 📦 Ajout de tous les fichiers modifiés...
git add .

echo.
echo 💾 Commit des corrections SFTP...
git commit -m "🔧 FIX SFTP: Gestion connexions concurrentes + MaxListeners + Retry automatique + Réinitialisation client"

echo.
echo 🚀 Push vers GitHub...
git push origin main

echo.
echo ✅ Push terminé !
echo.
echo 📋 VÉRIFICATIONS À FAIRE :
echo.
echo 1. 🌐 Allez sur https://dashboard.render.com
echo 2. 🔍 Sélectionnez "boulangerie-planning-api-4-pbfy" (ou "boulangerie-planning-api-4")
echo 3. 📊 Vérifiez l'onglet "Events" pour voir si un déploiement se lance
echo.
echo ⚠️  Si aucun déploiement ne se lance automatiquement :
echo.
echo    Option A - Déploiement manuel :
echo    1. Cliquez sur "Manual Deploy"
echo    2. Sélectionnez "Deploy latest commit"
echo    3. Attendez que le déploiement se termine
echo.
echo    Option B - Vérifier Auto-Deploy :
echo    1. Allez dans Settings > Build & Deploy
echo    2. Vérifiez que "Auto-Deploy" est sur "Yes"
echo    3. Vérifiez que la branche est "main"
echo.
echo    Option C - Vérifier les Pipeline Minutes :
echo    1. Allez dans votre workspace Render
echo    2. Vérifiez les "Pipeline Minutes" restants
echo    3. Si épuisés, attendez le mois suivant ou upgradez le plan
echo.
echo 📊 Corrections SFTP déployées :
echo    ✅ Gestion des connexions concurrentes (mutex)
echo    ✅ Augmentation MaxListeners (évite les warnings)
echo    ✅ Retry automatique sur erreurs de connexion
echo    ✅ Réinitialisation du client en cas d'erreur
echo    ✅ Vérification de l'état réel de la connexion
echo    ✅ Timeout augmenté à 30 secondes
echo    ✅ Keepalive pour maintenir la connexion
echo.
pause
