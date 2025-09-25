@echo off
echo ========================================
echo DEPLOIEMENT CORRECTIONS URGENTES
echo ========================================
echo.

echo [1/4] Ajout des fichiers au git...
git add .
echo.

echo [2/4] Commit des modifications...
git commit -m "fix: Corrections urgentes système

- Correction erreur SFTP Client constructor
- Amélioration affichage header (titre + bulle admin)
- Ajout bouton export Excel dans Imprimer État
- Correction largeur colonnes frais KM (Anaïs)
- Réduction taille bulle administrateur
- Décalage titre vers la gauche"
echo.

echo [3/4] Push vers le repository...
git push origin main
echo.

echo [4/4] Deploiement termine !
echo.
echo ========================================
echo CORRECTIONS APPLIQUEES:
echo ========================================
echo.
echo ✅ Erreur SFTP corrigée
echo ✅ Header amélioré (titre + bulle)
echo ✅ Bouton export Excel ajouté
echo ✅ Frais KM Anaïs corrigé
echo ✅ Interface plus propre
echo.
echo 🌐 Le système devrait maintenant fonctionner correctement
echo ========================================
pause
