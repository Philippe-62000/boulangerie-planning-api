@echo off
echo Verification de l'API sur OVH...

echo.
echo Test de l'endpoint de sante...
curl -s https://www.filmara.fr/api/health

echo.
echo Test de l'endpoint employees...
curl -s https://www.filmara.fr/api/employees

echo.
echo Test termine.
pause
