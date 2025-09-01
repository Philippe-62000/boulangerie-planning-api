@echo off
echo ========================================
echo 🚀 PUSH VERS MAIN - Boulangerie Planning
echo ========================================
echo.

echo 📋 Étape 1: Vérification de la branche actuelle...
git branch --show-current
echo.

echo 📋 Étape 2: Ajout des fichiers modifiés...
git add VERSION.md ARCHITECTURE-PROJET.md push-to-main.bat
echo ✅ Fichiers ajoutés
echo.

echo 📋 Étape 3: Commit des changements...
git commit -m "📝 v1.2.3 - Correction formations + Ajustement heures contractuelles"
echo ✅ Commit créé
echo.

echo 📋 Étape 4: Push sur master...
git push origin master
echo ✅ Push sur master terminé
echo.

echo 📋 Étape 5: Switch vers main...
git checkout main
echo ✅ Branch main active
echo.

echo 📋 Étape 6: Merge de master vers main...
git merge master
echo ✅ Merge terminé
echo.

echo 📋 Étape 7: Push sur main (déclenche Render)...
git push origin main
echo ✅ Push sur main terminé
echo.

echo ========================================
echo 🎉 DÉPLOIEMENT TERMINÉ !
echo ========================================
echo.
echo 📊 Version déployée : v1.2.3
echo 🌐 Render va redéployer automatiquement
echo ⏰ Attendez 2-3 minutes pour vérifier
echo.
echo 🔍 Pour vérifier : Dashboard Render
echo 📅 Date du déploiement : %date% %time%
echo.

pause
