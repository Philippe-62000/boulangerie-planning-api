@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #019 - DEBUG SYNCHRONISATION
echo ============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 CORRECTIONS :
echo - Logs debug synchronisation congés (backend)
echo - Suppression calcul jours dans calendrier
echo - Amélioration visibilité tableau
echo.
echo 🔍 TESTEZ :
echo 1. Valider une demande de congés Camille
echo 2. Vérifier logs backend pour synchronisation
echo 3. Dashboard devrait afficher Camille en congés
echo.
pause




