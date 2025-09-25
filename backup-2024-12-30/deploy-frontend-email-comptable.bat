@echo off
echo 🚀 Déploiement frontend - Configuration Email Comptable
echo.

echo 📦 Copie des fichiers vers OVH...
xcopy "frontend\build\*" "C:\Users\%USERNAME%\Desktop\boulangerie-planning\plan\" /E /H /C /I /Y

echo.
echo ✅ Déploiement terminé !
echo 📋 Nouvelles fonctionnalités disponibles :
echo    - Bouton de sauvegarde pour l'email du comptable
echo    - Interface améliorée dans la page Paramètres
echo    - Configuration automatique du paramètre accountantEmail
echo.
echo 🌐 Testez maintenant la page Paramètres
echo.
pause







