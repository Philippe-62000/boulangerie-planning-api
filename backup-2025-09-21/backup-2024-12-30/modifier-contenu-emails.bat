@echo off
echo ============================================================
echo 📧 GUIDE MODIFICATION CONTENU EMAILS
echo ============================================================
echo.

echo 🎯 OPTIONS POUR MODIFIER LE CONTENU DES EMAILS :
echo.

echo 1. MODIFIER LE TEMPLATE EMAILJS (SIMPLE) :
echo    - Aller sur: https://dashboard.emailjs.com/admin/templates
echo    - Trouver le template: template_sick_leave
echo    - Cliquer sur "Edit"
echo    - Modifier le contenu
echo    - Sauvegarder
echo.
echo    ✅ Avantages: Simple, pas de redéploiement
echo    ❌ Inconvénients: Moins de flexibilité
echo.

echo 2. MODIFIER LE CODE (FLEXIBLE) :
echo    - Fichier: backend/services/emailServiceAlternative.js
echo    - Méthodes à modifier:
echo      * generateValidationEmailHTML()
echo      * generateValidationEmailText()
echo      * generateRejectionEmailHTML()
echo      * generateRejectionEmailText()
echo      * generateAccountantEmailHTML()
echo      * generateAccountantEmailText()
echo.
echo    ✅ Avantages: Contrôle total, personnalisation avancée
echo    ❌ Inconvénients: Nécessite redéploiement
echo.

echo 📋 TYPES D'EMAILS DISPONIBLES :
echo.
echo 1. EMAIL DE VALIDATION (aux salariés) :
echo    - Sujet: "Arrêt maladie validé - [Nom]"
echo    - Contenu: Confirmation de validation
echo.
echo 2. EMAIL DE REJET (aux salariés) :
echo    - Sujet: "Arrêt maladie rejeté - [Nom]"
echo    - Contenu: Raison du rejet
echo.
echo 3. EMAIL AU COMPTABLE :
echo    - Sujet: "Nouvel arrêt maladie validé - [Nom]"
echo    - Contenu: Détails pour le comptable
echo.

echo 🔧 VARIABLES DISPONIBLES :
echo.
echo - {{sickLeave.employeeName}} : Nom du salarié
echo - {{sickLeave.employeeEmail}} : Email du salarié
echo - {{sickLeave.startDate}} : Date de début
echo - {{sickLeave.endDate}} : Date de fin
echo - {{sickLeave.duration}} : Durée en jours
echo - {{sickLeave.originalFileName}} : Nom du fichier
echo - {{validatedBy}} : Nom de la personne qui valide
echo - {{rejectionReason}} : Raison du rejet
echo.

echo 📝 EXEMPLE DE MODIFICATION :
echo.
echo Pour modifier l'email de validation, éditez la méthode:
echo generateValidationEmailHTML() dans le fichier
echo backend/services/emailServiceAlternative.js
echo.

echo 🚀 APRÈS MODIFICATION :
echo.
echo 1. Sauvegarder le fichier
echo 2. git add .
echo 3. git commit -m "Modification contenu email"
echo 4. git push origin main
echo 5. Attendre le déploiement (2-3 minutes)
echo.

echo 🔗 LIENS UTILES :
echo.
echo - EmailJS Templates: https://dashboard.emailjs.com/admin/templates
echo - Fichier à modifier: backend/services/emailServiceAlternative.js
echo.

pause
