@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #008 - DEBUG MODAL FERMETURE
echo =======================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #008" sur les pages
echo - Surveillez les logs pour identifier pourquoi le modal se ferme
echo - Recherchez "🔧 MODAL FERMÉ - Stack trace" dans la console
echo.
pause

