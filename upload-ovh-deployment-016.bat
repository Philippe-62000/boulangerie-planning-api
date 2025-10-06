@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #016 - CORRECTIONS CRITIQUES
echo ============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 CORRECTIONS CRITIQUES :
echo - Rôles employés corrigés (9 rôles au lieu de 7)
echo - Statut congés corrigé (validated au lieu de accepted)
echo - Correspondance employé-congés par nom (pas ID)
echo - Logs de debug ajoutés pour troubleshooting
echo.
echo 🔍 TESTEZ :
echo 1. Page employés : Rôles mis à jour
echo 2. Calendrier : Camille devrait apparaître
echo 3. Dashboard : Devrait se mettre à jour
echo.
pause





