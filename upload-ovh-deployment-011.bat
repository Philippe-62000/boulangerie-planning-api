@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #011 - GESTION ERREUR DÉSACTIVÉE
echo ============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #010" sur les pages
echo - Plus d'erreur JavaScript ligne 39 (gestion d'erreur désactivée)
echo - Le modal devrait enfin être VISIBLE sans page grisée !
echo.
pause

