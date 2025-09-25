@echo off
echo ========================================
echo 📋 CONSERVATION DES SCRIPTS ESSENTIELS
echo ========================================

echo 📋 Scripts de déploiement conservés:
echo ✅ deploy-nouvelle-version.bat (Déploiement complet)
echo ✅ deploy-ovh-nouvelle-version.bat (Déploiement OVH complet)
echo ✅ deploy-ovh-rapide.bat (Déploiement OVH rapide)
echo ✅ deploy-production-corrections.bat (Corrections production)
echo ✅ deploy-production-propre.bat (Déploiement propre)
echo ✅ deploy-corrections-interface.bat (Corrections interface)
echo ✅ nettoyer-repertoire.bat (Nettoyage)
echo ✅ push-to-main.bat (Push GitHub)
echo ✅ verifier-deploiement.bat (Vérification)
echo ✅ verifier-github.bat (Vérification GitHub)

echo.
echo 📋 Fichiers de configuration conservés:
echo ✅ constraint-calculator.py (Service Python OR-Tools)
echo ✅ constraint-calculator-requirements.txt (Dépendances Python)
echo ✅ requirements.txt (Dépendances Python)
echo ✅ render.yaml (Configuration Render)
echo ✅ render-ortools.yaml (Configuration OR-Tools)
echo ✅ render-planning-generator.yaml (Configuration Planning)
echo ✅ .htaccess-ovh (Configuration OVH)

echo.
echo 📋 Documentation conservée:
echo ✅ ARCHITECTURE-PROJET.md (Documentation principale)
echo ✅ ARCHITECTURE-DISTRIBUTEE.md (Architecture distribuée)
echo ✅ VERSION.md (Historique des versions)
echo ✅ Tous les fichiers CORRECTION-*.md
echo ✅ Tous les fichiers DEPLOIEMENT-*.md
echo ✅ RESUME-MODIFICATIONS-COMPLET.md

echo.
echo 🎯 UTILISATION RECOMMANDÉE:
echo.
echo 🚀 Pour un déploiement complet:
echo    deploy-nouvelle-version.bat
echo.
echo 🌐 Pour un déploiement OVH rapide:
echo    deploy-ovh-rapide.bat
echo.
echo 🔧 Pour des corrections:
echo    deploy-corrections-interface.bat
echo.
echo 🧹 Pour nettoyer le répertoire:
echo    nettoyer-repertoire.bat
echo.
echo 📤 Pour pousser sur GitHub:
echo    push-to-main.bat

pause

