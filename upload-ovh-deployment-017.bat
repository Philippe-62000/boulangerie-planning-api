@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #017 - CORRECTIONS FINALES
echo ============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 CORRECTIONS FINALES :
echo - Champs apprentis restaurés (fin contrat, tuteur)
echo - Légende calendrier simplifiée (3 couleurs seulement)
echo - Logs debug dashboard pour congés
echo.
echo 🔍 TESTEZ :
echo 1. Page employés : Champs apprentis visibles
echo 2. Calendrier : Légende simplifiée (3 couleurs)
echo 3. Dashboard : Logs dans console pour debug congés
echo.
pause




