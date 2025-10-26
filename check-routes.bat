@echo off
echo 🔍 Vérification des routes documents...
echo.

echo 📁 Vérification du fichier routes/documents.js...
if exist "backend\routes\documents.js" (
    echo ✅ backend\routes\documents.js existe
) else (
    echo ❌ backend\routes\documents.js manquant
)

echo.
echo 📁 Vérification du fichier controllers/documentController.js...
if exist "backend\controllers\documentController.js" (
    echo ✅ backend\controllers\documentController.js existe
) else (
    echo ❌ backend\controllers\documentController.js manquant
)

echo.
echo 📁 Vérification de la route dans server.js...
findstr /C:"app.use('/api/documents'" backend\server.js
if %errorlevel% equ 0 (
    echo ✅ Route documents trouvée dans server.js
) else (
    echo ❌ Route documents manquante dans server.js
)

echo.
echo 📁 Vérification du script create-uploads-dir.js...
if exist "backend\scripts\create-uploads-dir.js" (
    echo ✅ Script create-uploads-dir.js existe
) else (
    echo ❌ Script create-uploads-dir.js manquant
)

echo.
echo 📁 Vérification du package.json...
findstr /C:"create-uploads-dir" backend\package.json
if %errorlevel% equ 0 (
    echo ✅ Script intégré dans package.json
) else (
    echo ❌ Script manquant dans package.json
)

echo.
echo 🎯 Résumé :
echo - Si tous les fichiers existent : ✅ Prêt pour le déploiement
echo - Si des fichiers manquent : ❌ Créer les fichiers manquants
echo.
pause
