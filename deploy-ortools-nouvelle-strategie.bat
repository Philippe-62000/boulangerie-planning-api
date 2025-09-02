@echo off
echo ========================================
echo 🚀 DÉPLOIEMENT NOUVELLE STRATÉGIE OR-TOOLS
echo ========================================

echo 📋 Étape 1: Ajout des fichiers modifiés...
git add ortools-api.py
git add backend/controllers/planningController.js
git add NOUVELLE-STRATEGIE-PLANNING.md
git add test-nouvelle-strategie.js
git add deploy-ortools-nouvelle-strategie.bat

echo 📋 Étape 2: Commit des changements...
git commit -m "🎯 v2.0.0 - NOUVELLE STRATÉGIE PLANNING : Implémentation complète avec historique weekend, groupes de compétences, créneaux 7h30/11h/12h et ajustement horaires précis"

echo 📋 Étape 3: Push vers le repository principal...
git push origin main

echo 📋 Étape 4: Vérification du déploiement API OR-Tools...
echo ⏳ Attente 30 secondes pour le redéploiement Render...
timeout /t 30

echo 📋 Étape 5: Test de l'API OR-Tools mise à jour...
curl https://planning-ortools-api.onrender.com/

echo.
echo 🎉 DÉPLOIEMENT TERMINÉ !
echo 📊 Version déployée : v2.0.0 - Nouvelle Stratégie
echo 🌐 L'API OR-Tools va redémarrer automatiquement sur Render
echo.
echo ⚠️  IMPORTANT: Attendez 2-3 minutes que Render redémarre l'API avant de tester
echo.
pause
