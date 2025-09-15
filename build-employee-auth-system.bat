@echo off
echo ========================================
echo 🚀 BUILD SYSTEME AUTHENTIFICATION SALARIES
echo ========================================
echo.

echo 📦 Installation des dépendances backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur installation dépendances backend
    pause
    exit /b 1
)

echo.
echo 📦 Installation des dépendances frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur installation dépendances frontend
    pause
    exit /b 1
)

echo.
echo 🔨 Build du frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur build frontend
    pause
    exit /b 1
)

echo.
echo ✅ Build terminé avec succès !
echo.
echo 📋 RÉSUMÉ DES NOUVELLES FONCTIONNALITÉS :
echo.
echo 🔐 AUTHENTIFICATION SALARIÉS :
echo   - Modèle Employee avec champs email/password
echo   - Contrôleur d'authentification (authController.js)
echo   - Routes d'authentification (/api/auth)
echo   - Middleware de vérification JWT
echo.
echo 📧 EMAIL MOT DE PASSE :
echo   - Template email personnalisable
echo   - Service d'envoi avec EmailJS
echo   - Variables : nom, email, mot de passe, URL
echo.
echo 🖥️ INTERFACES UTILISATEUR :
echo   - Page Employees : champ email + bouton "Mot de passe"
echo   - Page connexion : salarie-connexion.html
echo   - Dashboard salarié : employee-dashboard.html
echo   - 2 onglets : Arrêt maladie + Demande congés
echo.
echo 🎯 FONCTIONNALITÉS :
echo   - Génération mot de passe aléatoire (8 caractères)
echo   - Hashage bcrypt avec salt 10
echo   - Session JWT 24h
echo   - Validation email côté client/serveur
echo   - Interface responsive et moderne
echo.
echo 📁 FICHIERS CRÉÉS/MODIFIÉS :
echo   Backend:
echo   - backend/models/Employee.js (champs email/password)
echo   - backend/controllers/authController.js (nouveau)
echo   - backend/routes/auth.js (nouveau)
echo   - backend/services/emailService.js (méthode sendEmployeePassword)
echo   - backend/services/emailServiceAlternative.js (template email)
echo   - backend/controllers/emailTemplateController.js (template par défaut)
echo.
echo   Frontend:
echo   - frontend/src/components/EmployeeModal.js (champ email)
echo   - frontend/src/pages/Employees.js (bouton mot de passe)
echo   - frontend/src/pages/Parameters.js (template email)
echo   - frontend/public/salarie-connexion.html (nouveau)
echo   - frontend/public/employee-dashboard.html (nouveau)
echo.
echo 🚀 PRÊT POUR LE DÉPLOIEMENT !
echo.
echo 📝 PROCHAINES ÉTAPES :
echo   1. Déployer le backend sur Render
echo   2. Déployer le frontend sur OVH
echo   3. Tester l'envoi d'email
echo   4. Configurer un employé avec email
echo   5. Tester la connexion salarié
echo.
pause

