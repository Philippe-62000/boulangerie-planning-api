@echo off
echo 🚀 UPLOAD OVH - DEPLOIEMENT #020 - SYNCHRONISATION + FILTRES
echo ============================================================

echo 📁 Copie des fichiers vers OVH...
echo.

echo 🔄 Copie du dossier build...
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10

echo.
echo ✅ Upload terminé !
echo.
echo 🎯 NOUVELLES FONCTIONNALITÉS :
echo - Bouton synchronisation forcée des congés
echo - Filtres par statut (Toutes/En attente/Validées/Rejetées)
echo - Filtres par année des congés (2024/2025/2026)
echo - Affichage optimisé (congés de l'année en cours)
echo.
echo 🔍 TESTEZ :
echo 1. Cliquez sur "🔄 Synchroniser Congés" pour forcer la sync
echo 2. Utilisez les filtres pour optimiser l'affichage
echo 3. Dashboard devrait maintenant afficher Camille en congés
echo.
pause



