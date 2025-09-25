@echo off
echo ========================================
echo 🧹 NETTOYAGE DU RÉPERTOIRE - Boulangerie Planning
echo ========================================

echo 📋 Étape 1: Sauvegarde des fichiers essentiels...
echo ✅ Garder: backend/, frontend/, .gitignore
echo ✅ Garder: Tous les fichiers *.md
echo ✅ Garder: Scripts de déploiement récents
echo ✅ Garder: Fichiers de configuration

echo.
echo 📋 Étape 2: Suppression des anciens dossiers de déploiement...
if exist "deploy" rmdir /s /q "deploy"
if exist "deploy-ovh-absences-corrige" rmdir /s /q "deploy-ovh-absences-corrige"
if exist "deploy-ovh-classement" rmdir /s /q "deploy-ovh-classement"
if exist "deploy-ovh-corrige" rmdir /s /q "deploy-ovh-corrige"
if exist "deploy-ovh-debug-absences" rmdir /s /q "deploy-ovh-debug-absences"
if exist "deploy-ovh-final" rmdir /s /q "deploy-ovh-final"
if exist "deploy-ovh-nouvelle-version" rmdir /s /q "deploy-ovh-nouvelle-version"
if exist "node_modules" rmdir /s /q "node_modules"

echo 📋 Étape 3: Suppression des anciens scripts de déploiement...
del "apply-patches.bat" 2>nul
del "auto-apply-patches.bat" 2>nul
del "deploy-backend-stats-vente.bat" 2>nul
del "deploy-backend-strategy.bat" 2>nul
del "deploy-corrections-completes.bat" 2>nul
del "deploy-corrections-finales.bat" 2>nul
del "deploy-direct.bat" 2>nul
del "deploy-fix-datetime-comparison.bat" 2>nul
del "deploy-fix-http400.bat" 2>nul
del "deploy-fix-ortools-integers.bat" 2>nul
del "deploy-frontend-classement-corrige.bat" 2>nul
del "deploy-frontend-complet-final.bat" 2>nul
del "deploy-frontend-debug-absences.bat" 2>nul
del "deploy-frontend-fix.bat" 2>nul
del "deploy-frontend-logo.bat" 2>nul
del "deploy-frontend-menu-absences-corrige.bat" 2>nul
del "deploy-frontend-menu.bat" 2>nul
del "deploy-frontend-rapide.bat" 2>nul
del "deploy-frontend-stats-vente-ameliore.bat" 2>nul
del "deploy-frontend-stats-vente-corrige.bat" 2>nul
del "deploy-frontend-stats-vente.bat" 2>nul
del "deploy-frontend.bat" 2>nul
del "deploy-ortools-nouvelle-strategie.bat" 2>nul
del "deploy-quick-fix.bat" 2>nul
del "deploy-rapide.bat" 2>nul
del "force-ortools.bat" 2>nul
del "install-or-tools.bat" 2>nul
del "push-api-absences.bat" 2>nul
del "replace-with-patched.bat" 2>nul
del "test-backend.bat" 2>nul
del "test-frontend.bat" 2>nul
del "test-header.bat" 2>nul
del "test-logo-restaure.bat" 2>nul

echo 📋 Étape 4: Suppression des fichiers de test...
del "test-ajustement-planning.js" 2>nul
del "test-api-employees.js" 2>nul
del "test-api-simple.js" 2>nul
del "test-architecture-distributed.js" 2>nul
del "test-donnees-reelles.js" 2>nul
del "test-nouvelle-strategie.js" 2>nul
del "test-services-distributed.py" 2>nul

echo 📋 Étape 5: Suppression des fichiers de configuration obsolètes...
del "server.js" 2>nul
del "upload-to-ovh.ps1" 2>nul

echo 📋 Étape 6: Vérification des fichiers conservés...
echo.
echo 📁 DOSSIERS CONSERVÉS:
if exist "backend" echo ✅ backend/
if exist "frontend" echo ✅ frontend/
if exist ".vscode" echo ✅ .vscode/

echo.
echo 📄 FICHIERS CONSERVÉS:
if exist ".gitignore" echo ✅ .gitignore
if exist "push-to-main.bat" echo ✅ push-to-main.bat
if exist "verifier-deploiement.bat" echo ✅ verifier-deploiement.bat
if exist "verifier-github.bat" echo ✅ verifier-github.bat

echo.
echo 📄 SCRIPTS DE DÉPLOIEMENT CONSERVÉS:
if exist "deploy-nouvelle-version.bat" echo ✅ deploy-nouvelle-version.bat
if exist "deploy-ovh-nouvelle-version.bat" echo ✅ deploy-ovh-nouvelle-version.bat
if exist "deploy-ovh-rapide.bat" echo ✅ deploy-ovh-rapide.bat
if exist "deploy-production-corrections.bat" echo ✅ deploy-production-corrections.bat
if exist "deploy-production-propre.bat" echo ✅ deploy-production-propre.bat
if exist "deploy-corrections-interface.bat" echo ✅ deploy-corrections-interface.bat

echo.
echo 📄 FICHIERS DE CONFIGURATION CONSERVÉS:
if exist "constraint-calculator.py" echo ✅ constraint-calculator.py
if exist "constraint-calculator-requirements.txt" echo ✅ constraint-calculator-requirements.txt
if exist "requirements.txt" echo ✅ requirements.txt
if exist "render.yaml" echo ✅ render.yaml
if exist "render-ortools.yaml" echo ✅ render-ortools.yaml
if exist "render-planning-generator.yaml" echo ✅ render-planning-generator.yaml
if exist ".htaccess-ovh" echo ✅ .htaccess-ovh

echo.
echo 📄 DOCUMENTATION CONSERVÉE:
dir *.md /b

echo.
echo 🎉 NETTOYAGE TERMINÉ !
echo.
echo 📊 RÉSUMÉ:
echo ✅ Anciens dossiers de déploiement supprimés
echo ✅ Anciens scripts de déploiement supprimés
echo ✅ Fichiers de test supprimés
echo ✅ Fichiers de configuration obsolètes supprimés
echo ✅ Documentation (*.md) conservée
echo ✅ Scripts de déploiement récents conservés
echo ✅ Structure backend/frontend conservée
echo.
echo 📋 FICHIERS ESSENTIELS CONSERVÉS:
echo - backend/ (API Node.js)
echo - frontend/ (Application React)
echo - *.md (Documentation complète)
echo - Scripts de déploiement récents
echo - Fichiers de configuration Python/OR-Tools
echo - .gitignore, push-to-main.bat

pause

