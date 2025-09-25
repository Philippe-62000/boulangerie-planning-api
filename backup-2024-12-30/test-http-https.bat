@echo off
echo ========================================
echo TEST HTTP vs HTTPS
echo ========================================

echo [1/4] Test API Health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/health' -UseBasicParsing; Write-Host 'Status:' $response.StatusCode } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [2/4] Test CORS avec HTTP (www.filmara.fr)...
powershell -Command "try { $headers = @{'Origin' = 'http://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'CORS Header:' $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [3/4] Test CORS avec HTTPS (www.filmara.fr)...
powershell -Command "try { $headers = @{'Origin' = 'https://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'CORS Header:' $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [4/4] Test CORS avec HTTP (filmara.fr)...
powershell -Command "try { $headers = @{'Origin' = 'http://filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'CORS Header:' $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo ========================================
echo TESTS TERMINÉS
echo ========================================
echo.
echo Vérifiez que tous les tests retournent Status: 200
echo et que CORS Header contient l'origine correspondante
echo.
pause
