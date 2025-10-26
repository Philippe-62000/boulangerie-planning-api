@echo off
echo 🧹 Nettoyage des anciens documents...
echo.
echo ⚠️  ATTENTION ⚠️
echo Ce script va supprimer TOUS les anciens documents stockés sur Render
echo et dans la base de données MongoDB.
echo.
echo Les documents stockés sur le NAS ne seront PAS affectés.
echo.
set /p confirm="Êtes-vous sûr de vouloir continuer ? (oui/non): "
if /i not "%confirm%"=="oui" (
    echo ❌ Opération annulée
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage du nettoyage...
echo.

cd backend
node scripts/cleanup-old-documents.js

echo.
echo ✅ Nettoyage terminé !
echo.
echo 📋 Résumé :
echo - Anciens documents supprimés de la base de données
echo - Fichiers locaux supprimés du serveur Render
echo - Le système utilise maintenant uniquement le NAS
echo.
pause
