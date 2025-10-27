@echo off
echo 🧪 Test d'upload de document...
echo.

echo Création d'un fichier de test...
echo Test document content > test-document.txt

echo.
echo Upload du document via API...
curl -X POST "https://boulangerie-planning-api-4-pbfy.onrender.com/api/documents/upload" ^
  -F "file=@test-document.txt" ^
  -F "title=Document de Test" ^
  -F "type=general" ^
  -F "category=test"

echo.
echo Nettoyage du fichier de test...
del test-document.txt

echo.
echo ✅ Test terminé !
pause
