@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #003
echo =================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Le bouton "📅 Impression Calendrier" doit ouvrir /plan/vacation-planning
echo - Le bouton "✏️ Modifier" doit fonctionner avec les logs de debug
echo - Vous devez voir "🚀 DEPLOIEMENT #003" sur les pages
echo.
pause
