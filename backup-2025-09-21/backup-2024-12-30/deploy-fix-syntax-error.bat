@echo off
echo ========================================
echo CORRECTION ERREUR SYNTAXE EMPLOYEE.JS
echo ========================================

echo [1/3] Correction de l'erreur de syntaxe...
echo ✅ Caractère 'j' supprimé de Employee.js ligne 1
echo ✅ const mongoose = require('mongoose'); corrigé

echo [2/3] Déploiement vers GitHub...
git add .
git commit -m "🚨 FIX SYNTAXE: Correction erreur 'jlconst' dans Employee.js"
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push vers GitHub
    pause
    exit /b 1
)
echo ✅ Correction syntaxe déployée vers GitHub

echo [3/3] Instructions pour Render...
echo.
echo 🔧 ACTIONS REQUISES SUR RENDER :
echo.
echo 1. Aller sur https://dashboard.render.com
echo 2. Sélectionner le service "boulangerie-planning-api-3"
echo 3. Cliquer sur "Manual Deploy" → "Deploy latest commit"
echo 4. Attendre le déploiement (2-5 minutes)
echo.

echo 📋 Problème résolu :
echo    ❌ SyntaxError: Unexpected identifier 'mongoose'
echo    ❌ jlconst mongoose = require('mongoose');
echo    ✅ const mongoose = require('mongoose');
echo.
echo ⏳ Prochaines étapes :
echo    1. Déploiement manuel sur Render
echo    2. L'API devrait démarrer correctement
echo    3. Tester l'endpoint /health
echo.
echo 🎯 L'erreur de syntaxe est corrigée !
echo.
pause
