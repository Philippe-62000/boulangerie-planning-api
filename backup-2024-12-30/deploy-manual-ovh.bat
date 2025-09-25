@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT MANUEL OVH
echo ========================================
echo.

echo ❌ PROBLÈME RENDER :
echo   - Limite de minutes de build atteinte
echo   - Reset prévu le 10/01/25
echo   - Déploiement automatique bloqué
echo.

echo ✅ SOLUTION TEMPORAIRE :
echo   - Utiliser les fichiers déjà buildés
echo   - Upload manuel sur OVH
echo   - Le backend fonctionne déjà
echo.

echo 📁 FICHIERS PRÊTS POUR OVH :
echo   - Dossier: frontend-ovh\
echo   - Tous les fichiers sont à jour
echo   - Nouvelles pages incluses:
echo     ✅ salarie-connexion.html
echo     ✅ employee-dashboard.html
echo     ✅ vacation-request-standalone.html
echo.

echo 🎯 FONCTIONNALITÉS DISPONIBLES :
echo   - Système d'authentification salariés
echo   - Page de gestion des congés
echo   - Templates email personnalisables
echo   - Dashboard salarié avec 2 onglets
echo.

echo 📋 INSTRUCTIONS UPLOAD OVH :
echo   1. Se connecter à votre espace OVH
echo   2. Aller dans le gestionnaire de fichiers
echo   3. Naviguer vers le dossier www/
echo   4. Supprimer les anciens fichiers (sauf .htaccess)
echo   5. Uploader tous les fichiers du dossier frontend-ovh/
echo   6. Vérifier les permissions (644 pour fichiers, 755 pour dossiers)
echo.

echo 🔗 URLS À TESTER :
echo   - https://www.filmara.fr/plan (interface admin)
echo   - https://www.filmara.fr/salarie-connexion.html (connexion salarié)
echo   - https://www.filmara.fr/employee-dashboard.html (dashboard salarié)
echo.

echo ⚠️  BACKEND RENDER :
echo   - Le backend fonctionne déjà
echo   - API disponible: https://boulangerie-planning-api-3.onrender.com/api
echo   - Les permissions de menu seront créées au prochain redémarrage
echo.

echo 🎉 PRÊT POUR L'UPLOAD OVH !
echo.
pause









