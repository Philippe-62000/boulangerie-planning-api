@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #009 - DEBUG MODAL FERMETURE AVANCÉ
echo ==============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 Testez maintenant :
echo - Vous devez voir "🚀 DEPLOIEMENT #008" sur les pages
echo - Cliquez sur "Modifier" et surveillez la console
echo - Recherchez "🔧 MODAL FERMÉ - Stack trace" pour identifier la cause
echo.
pause

