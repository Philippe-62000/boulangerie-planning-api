@echo off
echo ========================================
echo DEPLOIEMENT CORRECTIONS ARRETS MALADIE
echo ========================================
echo.

echo [1/4] Ajout des fichiers au git...
git add .
echo.

echo [2/4] Commit des modifications...
git commit -m "fix: Corrections système arrêts maladie

- Menu déroulant des salariés depuis la base de données
- Email automatiquement rempli selon le salarié sélectionné
- Page d'upload standalone sans menu flottant
- Textes modifiés selon les demandes utilisateur
- Interface intégrée dans le menu admin
- Corrections CSS pour les nouveaux éléments"
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
echo ✅ Menu déroulant des salariés
echo ✅ Email automatique selon sélection
echo ✅ Page upload sans menu flottant
echo ✅ Textes modifiés
echo ✅ Interface admin intégrée
echo.
echo 🌐 URLs d'accès:
echo - Salariés: https://www.filmara.fr/plan/sick-leave-upload
echo - Admin: https://www.filmara.fr/plan/sick-leave-management
echo.
echo ========================================
echo CORRECTIONS TERMINEES !
echo ========================================
pause
