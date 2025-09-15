@echo off
echo 🔧 Correction des dépendances Render...
echo.

echo 📝 Mise à jour du package.json avec dépendances complètes...

REM Créer un package.json robuste avec toutes les dépendances
echo { > backend\package.json
echo   "name": "backend", >> backend\package.json
echo   "version": "1.0.0", >> backend\package.json
echo   "description": "API Backend pour le système de planification boulangerie", >> backend\package.json
echo   "main": "server.js", >> backend\package.json
echo   "scripts": { >> backend\package.json
echo     "test": "echo \"Error: no test specified\" && exit 1", >> backend\package.json
echo     "start": "node server.js", >> backend\package.json
echo     "dev": "nodemon server.js", >> backend\package.json
echo     "build": "echo 'Backend build completed'", >> backend\package.json
echo     "postinstall": "npm install", >> backend\package.json
echo     "pm2:start": "pm2 start server.js --name boulangerie-api", >> backend\package.json
echo     "pm2:stop": "pm2 stop boulangerie-api", >> backend\package.json
echo     "pm2:restart": "pm2 restart boulangerie-api" >> backend\package.json
echo   }, >> backend\package.json
echo   "keywords": ["boulangerie", "planning", "api", "nodejs"], >> backend\package.json
echo   "author": "", >> backend\package.json
echo   "license": "ISC", >> backend\package.json
echo   "dependencies": { >> backend\package.json
echo     "bcryptjs": "^2.4.3", >> backend\package.json
echo     "compression": "^1.7.4", >> backend\package.json
echo     "cors": "^2.8.5", >> backend\package.json
echo     "dotenv": "^16.3.1", >> backend\package.json
echo     "express": "^4.18.2", >> backend\package.json
echo     "helmet": "^7.0.0", >> backend\package.json
echo     "jsonwebtoken": "^9.0.2", >> backend\package.json
echo     "mongoose": "^7.5.0", >> backend\package.json
echo     "multer": "^1.4.5-lts.1", >> backend\package.json
echo     "node-fetch": "^2.6.7", >> backend\package.json
echo     "nodemailer": "^6.9.7", >> backend\package.json
echo     "pdf-parse": "^1.1.1", >> backend\package.json
echo     "sharp": "^0.32.6", >> backend\package.json
echo     "ssh2-sftp-client": "^10.0.3" >> backend\package.json
echo   }, >> backend\package.json
echo   "devDependencies": { >> backend\package.json
echo     "nodemon": "^3.0.1" >> backend\package.json
echo   }, >> backend\package.json
echo   "engines": { >> backend\package.json
echo     "node": ">=14.0.0" >> backend\package.json
echo   } >> backend\package.json
echo } >> backend\package.json

echo ✅ Package.json mis à jour avec toutes les dépendances
echo.

echo 📝 Commit et push des corrections...
git add backend/package.json
git commit -m "Fix: Ajout de toutes les dépendances manquantes pour Render (jsonwebtoken, multer, sharp, etc.)"
git push origin main

echo.
echo ✅ Corrections déployées !
echo.
echo 🔄 Render va maintenant :
echo    1. Réinstaller toutes les dépendances
echo    2. Redémarrer le service automatiquement
echo    3. Résoudre l'erreur MODULE_NOT_FOUND
echo.
echo 📋 Dépendances ajoutées :
echo    - jsonwebtoken ^9.0.2
echo    - multer ^1.4.5-lts.1  
echo    - sharp ^0.32.6
echo    - pdf-parse ^1.1.1
echo    - ssh2-sftp-client ^10.0.3
echo    - nodemailer ^6.9.7
echo.
pause