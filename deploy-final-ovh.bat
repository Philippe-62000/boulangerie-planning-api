@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT FINAL OVH
echo ========================================
echo.

echo ✅ VERSION FINALE :
echo   📁 Dossier : frontend-login-fix/
echo   🔗 API : https://boulangerie-planning-api-4.onrender.com/api
echo   📍 Structure simplifiée (sans dossier /plan/)
echo.

echo 📋 FICHIERS PRÊTS :
echo   ✅ index.html (interface admin)
echo   ✅ salarie-connexion.html (connexion salarié)
echo   ✅ employee-dashboard.html (dashboard salarié - RACINE)
echo   ✅ vacation-request-standalone.html (demande congés)
echo   ✅ sick-leave-standalone.html (arrêt maladie)
echo   ✅ sick-leave-simple.html
echo   ✅ static/ (CSS/JS avec nouvelle API)
echo.

echo 🔗 URLS FINALES :
echo   - Interface admin : https://www.filmara.fr/plan
echo   - Connexion salarié : https://www.filmara.fr/salarie-connexion.html
echo   - Dashboard salarié : https://www.filmara.fr/employee-dashboard.html
echo   - Demande congés : https://www.filmara.fr/vacation-request-standalone.html
echo   - Arrêt maladie : https://www.filmara.fr/sick-leave-standalone.html
echo.

echo 📂 STRUCTURE FINALE :
echo   frontend-login-fix/
echo   ├── index.html
echo   ├── salarie-connexion.html
echo   ├── employee-dashboard.html (À LA RACINE)
echo   ├── vacation-request-standalone.html
echo   ├── sick-leave-standalone.html
echo   ├── sick-leave-simple.html
echo   ├── asset-manifest.json
echo   ├── manifest.json
echo   ├── http-redirect.html
echo   └── static/
echo       ├── css/
echo       └── js/
echo.

echo 🎯 REDIRECTION CORRECTE :
echo   salarie-connexion.html → /employee-dashboard.html
echo   (Pas de dossier /plan/ nécessaire)
echo.

echo ⚠️  INSTRUCTIONS UPLOAD OVH :
echo   1. Se connecter à l'espace OVH
echo   2. Aller dans le gestionnaire de fichiers  
echo   3. Naviguer vers www/
echo   4. Supprimer les anciens fichiers (SAUF .htaccess)
echo   5. Uploader TOUS les fichiers de frontend-login-fix/
echo   6. Vérifier les permissions (644 pour fichiers, 755 pour dossiers)
echo.

echo 🎉 SYSTÈME COMPLET PRÊT !
echo   ✅ Authentification salariés
echo   ✅ Dashboard avec onglets
echo   ✅ API connectée à Render
echo   ✅ Structure OVH optimisée
echo.
pause







