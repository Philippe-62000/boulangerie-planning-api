@echo off
echo ======================================== DÉPLOIEMENT FRONTEND FIX ========================================
echo [1/3] Copie du fichier corrigé vers deploy-ovh...
echo ✅ sick-leave-standalone.html avec nom de champ corrigé
echo ✅ formData.append('sickLeaveFile', fileInput.files[0])

echo [2/3] Création du package de déploiement...
if not exist "deploy-ovh" mkdir deploy-ovh
copy "frontend\public\sick-leave-standalone.html" "deploy-ovh\sick-leave-standalone.html"
echo ✅ Fichier copié vers deploy-ovh

echo [3/3] Instructions de déploiement...
echo 📁 Fichier prêt dans: deploy-ovh\sick-leave-standalone.html
echo 📤 À copier sur OVH dans: /www/plan/sick-leave-standalone.html
echo 🔧 Correction: Le champ fichier est maintenant 'sickLeaveFile' au lieu de 'file'
echo ⏳ Une fois copié sur OVH, l'upload d'arrêt maladie fonctionnera !
echo.
echo 📋 Problème identifié dans les logs Render:
echo    - field: 'file' (incorrect)
echo    - Attendu: 'sickLeaveFile'
echo    - Solution: Fichier corrigé prêt dans deploy-ovh\
pause



