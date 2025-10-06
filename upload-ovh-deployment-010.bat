@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #010 - CORRECTION ERREUR JAVASCRIPT
echo =============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #009" sur les pages
echo - Plus d'erreur JavaScript à la ligne 39
echo - Le modal devrait maintenant être VISIBLE !
echo.
pause

