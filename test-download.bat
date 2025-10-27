@echo off
echo 🧪 Test de téléchargement de document...
echo.

echo Test du téléchargement du document ID: 68ff22410381c774e9376190
curl -v "https://boulangerie-planning-api-4-pbfy.onrender.com/api/documents/download/68ff22410381c774e9376190?employeeId=68b2e09d82eccfe63341f36b"

echo.
echo ✅ Test terminé !
pause
