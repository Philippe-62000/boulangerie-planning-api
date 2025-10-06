@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #007 - MODAL COMPLET AVEC CSS
echo =======================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #007" sur les pages
echo - Le modal devrait maintenant être COMPLÈTEMENT VISIBLE
echo - Avec titre, champs de dates, et boutons Annuler/Sauvegarder
echo.
pause

