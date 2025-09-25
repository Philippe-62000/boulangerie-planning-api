@echo off
echo ========================================
echo 🔧 CORRECTION PARAMÈTRES FRAIS KM
echo ========================================
echo.

echo 📋 Problème identifié :
echo    Les paramètres d'alerte email apparaissent dans la page Frais KM
echo    car ils ont kmValue: 0 au lieu de kmValue: -1
echo.

echo 🔧 Solution :
echo    Mettre à jour les paramètres existants avec kmValue: -1
echo    pour les exclure des frais KM
echo.

echo 📝 Paramètres à corriger :
echo    - siteName (Nom du Site)
echo    - accountantEmail (Email du Comptable)
echo    - storeEmail (Email du Magasin)
echo    - adminEmail (Email de l'Administrateur)
echo    - alertStore (Alerte au Magasin)
echo    - alertAdmin (Alerte à l'Administrateur)
echo.

echo 🚀 Instructions de correction :
echo    1. Déployer le backend avec les corrections
echo    2. Les nouveaux paramètres auront kmValue: -1
echo    3. Pour les paramètres existants, les mettre à jour manuellement
echo.

echo 💡 Commande de test pour vérifier :
echo    curl "https://boulangerie-planning-api-3.onrender.com/api/parameters"
echo.

echo 🎯 Résultat attendu :
echo    - Page Frais KM : seulement les paramètres 1-12 + Autre
echo    - Plus de paramètres d'alerte email dans le tableau
echo.

pause
