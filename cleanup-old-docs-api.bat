@echo off
echo 🧹 Nettoyage des anciens documents via API...
echo.

curl -X POST "https://boulangerie-planning-api-4-pbfy.onrender.com/api/documents/cleanup-old" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

echo.
echo ✅ Nettoyage terminé !
echo.
pause
