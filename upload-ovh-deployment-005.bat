@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #005 - FERMETURE OVERLAY DÉSACTIVÉE
echo =============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #005" sur les pages
echo - Le modal ne devrait PLUS se fermer automatiquement
echo - Testez la modification des dates
echo.
pause
