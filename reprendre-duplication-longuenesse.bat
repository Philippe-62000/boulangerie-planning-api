@echo off
echo ========================================
echo   REPRISE DUPLICATION LONGUENESSE
echo ========================================
echo.
echo Ce script vous guide pour reprendre la duplication
echo du site d'Arras pour Longuenesse.
echo.
echo ========================================
echo   ETAPE 1: VERIFICATION PREALABLE
echo ========================================
echo.
echo Vérifiez d'abord dans Render Dashboard:
echo   1. Le service boulangerie-planning-api-3 existe-t-il ?
echo   2. Est-il suspendu ou actif ?
echo   3. Les minutes de build sont-elles réinitialisées ?
echo.
echo Si le service n'existe plus, vous devrez le recréer.
echo.
pause
echo.
echo ========================================
echo   ETAPE 2: CONFIGURATION RENDER
echo ========================================
echo.
echo Vous devez maintenant configurer les variables
echo d'environnement dans Render pour le service api-3.
echo.
echo Ouvrez le fichier: REPRISE-DUPLICATION-LONGUENESSE.md
echo Section: "Étape 2 : Configurer les Variables d'Environnement"
echo.
echo Variables importantes:
echo   - MONGODB_URI (base: boulangerie-planning-longuenesse)
echo   - JWT_SECRET (NOUVELLE clé différente d'Arras)
echo   - CORS_ORIGIN (inclure https://www.filmara.fr/lon)
echo   - EMAILJS_* (nouveaux comptes pour Longuenesse)
echo   - SFTP_BASE_PATH (/n8n/uploads/documents-longuenesse)
echo   - STORE_NAME (Boulangerie Ange - Longuenesse)
echo.
pause
echo.
echo ========================================
echo   ETAPE 3: DEPLOIEMENT BACKEND
echo ========================================
echo.
echo Une fois les variables configurées dans Render:
echo   1. Allez dans le service boulangerie-planning-api-3
echo   2. Cliquez sur "Manual Deploy" ^> "Deploy latest commit"
echo   3. Attendez la fin du déploiement (2-3 minutes)
echo   4. Vérifiez les logs pour confirmer le démarrage
echo.
echo Test de l'API:
echo   curl https://boulangerie-planning-api-3.onrender.com/api/health
echo.
pause
echo.
echo ========================================
echo   ETAPE 4: BUILD FRONTEND
echo ========================================
echo.
echo Voulez-vous build le frontend maintenant ? (O/N)
set /p build_frontend="> "
if /i "%build_frontend%"=="O" (
    echo.
    echo Lancement du build frontend pour Longuenesse...
    call deploy-frontend-lon-ovh.bat
) else (
    echo.
    echo Vous pourrez build le frontend plus tard avec:
    echo   deploy-frontend-lon-ovh.bat
)
echo.
pause
echo.
echo ========================================
echo   ETAPE 5: UPLOAD FRONTEND OVH
echo ========================================
echo.
echo Pour uploader le frontend sur OVH:
echo   1. Créez le dossier /lon/ sur OVH (via gestionnaire de fichiers)
echo   2. Exécutez: upload-deploy-frontend-lon-ovh.bat
echo   3. OU uploadez manuellement via FTP/FileZilla
echo.
echo Le dossier deploy-frontend-lon/ contient tous les fichiers
echo à uploader dans /lon/ sur OVH.
echo.
pause
echo.
echo ========================================
echo   ETAPE 6: VERIFICATIONS FINALES
echo ========================================
echo.
echo Vérifiez que:
echo   - Backend accessible: https://boulangerie-planning-api-3.onrender.com/api/health
echo   - Frontend accessible: https://www.filmara.fr/lon/
echo   - Pas d'erreurs dans la console (F12)
echo   - Premier compte admin créé sur /lon/login
echo.
echo ========================================
echo   DOCUMENTATION COMPLETE
echo ========================================
echo.
echo Consultez le fichier: REPRISE-DUPLICATION-LONGUENESSE.md
echo pour toutes les instructions détaillées.
echo.
pause

