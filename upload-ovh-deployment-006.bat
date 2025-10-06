@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #006 - MODAL CSS FIX
echo ================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #006" sur les pages
echo - Le modal devrait maintenant être VISIBLE avec CSS inline
echo - Plus de page grisée bloquée !
echo.
pause
