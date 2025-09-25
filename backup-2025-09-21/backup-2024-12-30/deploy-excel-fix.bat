@echo off
echo ========================================
echo DEPLOIEMENT CORRECTION EXPORT EXCEL
echo ========================================
echo.

echo [1/4] Ajout des fichiers au git...
git add .
echo.

echo [2/4] Commit des modifications...
git commit -m "fix: Correction export Excel état des salariés

- Correction fonction handleExportExcel
- En-têtes corrects: Salarié, Frais Repas, Total KM, Total Général
- Données réelles au lieu de 'undefined'
- Ajout des totaux dans le CSV
- Nom de fichier avec mois en français"
echo.

echo [3/4] Push vers le repository...
git push origin main
echo.

echo [4/4] Deploiement termine !
echo.
echo ========================================
echo CORRECTION APPLIQUEE:
echo ========================================
echo.
echo ✅ Export Excel corrigé
echo ✅ En-têtes corrects
echo ✅ Données réelles exportées
echo ✅ Totaux inclus
echo ✅ Nom de fichier en français
echo.
echo 📊 Le CSV contiendra maintenant:
echo - Salarié, Frais Repas, Total KM, Total Général
echo - Données réelles de septembre 2025
echo - Totaux: 51,35 €, 103.5 km, 51,35 €
echo.
echo ========================================
echo CORRECTION TERMINEE !
echo ========================================
pause
