@echo off
echo Push vers GitHub en cours...

echo.
echo 1. Verification du statut Git...
git status

echo.
echo 2. Ajout des fichiers modifies...
git add backend/controllers/employeeController.js
git add backend/routes/employees.js

echo.
echo 3. Commit des modifications...
git commit -m "Ajout endpoint sick-leave et fonction declareSickLeave"

echo.
echo 4. Push vers GitHub...
git push -u origin main

echo.
echo Push termine !
pause
