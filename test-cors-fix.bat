@echo off
echo ========================================
echo TEST CORRECTION CORS
echo ========================================

echo [1/4] Test santé API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/health' -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'Content:' $response.Content } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [2/4] Test CORS avec origine www.filmara.fr...
powershell -Command "try { $headers = @{'Origin' = 'http://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/employees' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'CORS Headers:' $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [3/4] Test permissions menu...
powershell -Command "try { $headers = @{'Origin' = 'http://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [4/4] Test paramètres...
powershell -Command "try { $headers = @{'Origin' = 'http://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/parameters' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo ========================================
echo TESTS TERMINÉS
echo ========================================
echo.
echo Vérifiez que :
echo ✅ API répond (health)
echo ✅ CORS fonctionne avec www.filmara.fr
echo ✅ Permissions menu se chargent
echo ✅ Paramètres se chargent
echo.
echo Si tout fonctionne, le Dashboard devrait se charger !
echo.
pause
