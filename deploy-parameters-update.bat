@echo off
echo 🚀 Déploiement de la mise à jour Parameters avec l'onglet Documents
echo.

echo 📁 Vérification des fichiers modifiés...
if exist "frontend\src\pages\Parameters.js" (
    echo ✅ Parameters.js trouvé
) else (
    echo ❌ Parameters.js manquant
    pause
    exit /b 1
)

if exist "frontend\src\pages\Parameters.css" (
    echo ✅ Parameters.css trouvé
) else (
    echo ❌ Parameters.css manquant
    pause
    exit /b 1
)

echo.
echo 🔧 Modifications apportées :
echo ✅ Nouvel onglet "📁 Gestion des Documents" ajouté
echo ✅ Lien vers admin-documents.html intégré
echo ✅ Styles CSS pour l'onglet documents
echo ✅ Interface utilisateur complète avec instructions
echo.

echo 📋 Prochaines étapes :
echo 1. Compiler le frontend : npm run build
echo 2. Déployer via FileZilla vers OVH
echo 3. Tester l'accès à l'onglet Documents dans Parameters
echo.

echo 🎯 URLs de test :
echo - Parameters : https://www.filmara.fr/plan/parameters
echo - Admin Documents : https://www.filmara.fr/plan/admin-documents.html
echo.

echo ✅ Mise à jour préparée ! Vous pouvez maintenant compiler et déployer.
pause

