@echo off
echo 🔄 Forçage du redéploiement du backend...
echo.

echo 📝 Ajout d'un commentaire pour forcer le déploiement...
git add .
git commit -m "Fix: Correction des routes documents et configuration NAS"
git push origin main

echo.
echo ✅ Push effectué vers GitHub
echo 🚀 Render va automatiquement redéployer le backend
echo.
echo ⏳ Attendez 2-3 minutes que le déploiement se termine
echo 🔍 Vérifiez les logs sur Render pour confirmer le déploiement
echo.
pause
