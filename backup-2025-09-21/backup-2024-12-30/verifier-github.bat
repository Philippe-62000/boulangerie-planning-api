@echo off
echo ========================================
echo   VERIFICATION GITHUB ET RENDER
echo ========================================

echo.
echo 1. Verification du repository GitHub...
echo URL: https://github.com/Philippe-62000/boulangerie-planning-api
echo.
echo 2. Verification du dernier commit...
echo - Ouvrir le lien ci-dessus
echo - Verifier que le fichier backend/models/Employee.js a ete modifie
echo - birthDate doit etre "required: false" au lieu de "required: true"

echo.
echo 3. Verification du deployement Render...
echo URL: https://dashboard.render.com/
echo.
echo 4. Test de l'API apres deployement...
echo Test creation employe...
curl -X POST https://boulangerie-planning-api.onrender.com/api/employees -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"contractType\":\"CDI\",\"age\":25,\"role\":\"vendeuse\",\"weeklyHours\":35}" --max-time 10

echo.
echo 5. Test de l'application web...
echo URL: https://www.filmara.fr/plan/
echo.
echo Fonctionnalites a tester:
echo - Creation d'un nouvel employe (ne doit plus donner d'erreur 400)
echo - Modification d'un employe existant
echo - Declaration d'arret maladie

echo.
echo ✅ Verification terminee !
pause
