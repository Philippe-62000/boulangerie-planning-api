@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #004 - DEBUG MODAL
echo =============================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #004" sur les pages
echo - Le modal de modification avec debug avancé
echo - Surveillez les logs pour voir ce qui ferme le modal
echo.
pause
