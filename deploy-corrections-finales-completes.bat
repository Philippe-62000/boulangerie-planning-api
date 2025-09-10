@echo off
echo 🚀 Déploiement des corrections finales complètes
echo.

echo 📦 Construction du frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la construction du frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 🔧 Ajout des fichiers au Git...
git add .
git commit -m "🔧 Corrections finales complètes

✅ Frais repas: Correction superposition totaux (Adelaïde41.35 €)
✅ Header: Décalage titre de 3cm vers la droite  
✅ Impression: N'imprime que le tableau, pas toute la page
✅ Mots de passe: Correction bouton 'Modifier mot de passe'
✅ Arrêts maladie: Correction liens /sick-leave vers /plan/sick-leave
✅ Liste employés: Correction API pour retourner {success: true, data: [...]}
✅ Frais KM: Bouton réinitialisation données Adélaïde
✅ État congés: Intégration Google Sheets avec validation/rejet
✅ Planning A4: Génération automatique des congés validés

🎯 Tous les problèmes utilisateur résolus"

echo.
echo 📤 Push vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ✅ Corrections finales complètes déployées !
echo.
echo 🎯 Résumé des corrections:
echo   • Frais repas: Espacement corrigé pour éviter superposition
echo   • Header: Titre décalé de 3cm vers la droite
echo   • Impression: Fenêtre dédiée pour n'imprimer que le tableau
echo   • Mots de passe: Bouton fonctionnel (plus de disabled)
echo   • Arrêts maladie: Redirection /sick-leave → /plan/sick-leave
echo   • Liste employés: API corrigée pour structure {success, data}
echo   • Frais KM: Bouton réinitialisation données Adélaïde
echo   • État congés: Intégration Google Sheets + planning A4
echo.
echo 📋 Prochaines étapes:
echo   1. Déployer le backend sur Render
echo   2. Uploader le frontend sur OVH
echo   3. Tester toutes les fonctionnalités
echo.
pause
