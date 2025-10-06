@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #018 - CORRECTIONS FINALES
echo ============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 CORRECTIONS FINALES :
echo - Légende calendrier réorganisée (3 groupes)
echo - Texte en noir au lieu de blanc (meilleure visibilité)
echo - Champs tuteur pour tous les rôles apprentis
echo - Logs debug dashboard pour congés
echo.
echo 🔍 TESTEZ :
echo 1. Calendrier : Légende avec 3 groupes + texte noir
echo 2. Page employés : Champs tuteur pour rôles apprentis
echo 3. Dashboard : Logs dans console pour debug congés
echo.
pause




