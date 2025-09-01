@echo off
echo 🚀 Preparation du projet pour OVH...

echo 📦 Installation des dependances backend...
cd backend
call npm install
cd ..

echo 📦 Installation des dependances frontend...
cd frontend
call npm install

echo 🔨 Build du frontend...
call npm run build
cd ..

echo 📁 Creation du dossier de deployment...
if exist "deploy" rmdir /s /q "deploy"
mkdir deploy
mkdir deploy\www
mkdir deploy\api

echo 📋 Copie des fichiers...
xcopy "frontend\build\*" "deploy\www\" /E /I /Y
xcopy "backend\*" "deploy\api\" /E /I /Y
copy ".htaccess" "deploy\www\"

echo ✅ Fichiers prepares pour OVH !
echo.
echo 📋 Instructions :
echo 1. Ouvrir FileZilla
echo 2. Se connecter a votre espace OVH
echo 3. Uploader le contenu de 'deploy\www' vers 'www'
echo 4. Uploader le contenu de 'deploy\api' vers 'www\api'
echo 5. Configurer MongoDB Atlas (gratuit)
echo.
echo 🎉 Pret pour l'upload !
pause

