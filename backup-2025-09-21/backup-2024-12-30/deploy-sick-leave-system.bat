@echo off
echo ========================================
echo DEPLOIEMENT SYSTEME ARRETS MALADIE
echo ========================================
echo.

echo [1/4] Ajout des fichiers au git...
git add .
echo.

echo [2/4] Commit des modifications...
git commit -m "feat: Système complet de gestion des arrêts maladie

- Modèle de données SickLeave avec validation automatique
- Service SFTP pour upload vers NAS Synology
- Service de validation d'images (Sharp + PDF-parse)
- Contrôleur et routes API pour gestion complète
- Interface d'upload pour salariés (SickLeaveUpload)
- Interface de gestion admin (SickLeaveManagement)
- Page d'accueil pour salariés (SickLeaveHome)
- Intégration dans le menu admin
- Support JPG/PDF avec validation qualité
- Système de statuts (pending/validated/declared/rejected)
- Upload sécurisé vers NAS avec organisation par dossiers
- Validation automatique de qualité des documents"
echo.

echo [3/4] Push vers le repository...
git push origin main
echo.

echo [4/4] Deploiement termine !
echo.
echo ========================================
echo CONFIGURATION REQUISE SUR RENDER:
echo ========================================
echo.
echo 1. Ajouter la variable d'environnement:
echo    SFTP_PASSWORD=votre_mot_de_passe_nas
echo.
echo 2. Le systeme sera accessible via:
echo    - Salaries: https://www.filmara.fr/plan/sick-leave
echo    - Admin: https://www.filmara.fr/plan/sick-leave-management
echo.
echo 3. Structure NAS creee automatiquement:
echo    /sick-leaves/
echo    ├── 2025/
echo    │   ├── 01-janvier/
echo    │   ├── 02-fevrier/
echo    │   └── ...
echo    ├── pending/
echo    ├── validated/
echo    └── declared/
echo.
echo ========================================
echo SYSTEME PRET A L'UTILISATION !
echo ========================================
pause
