@echo off
echo ========================================
echo TEST HTTPS UNIQUEMENT
echo ========================================

echo [1/3] Test API Health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/health' -UseBasicParsing; Write-Host 'Status:' $response.StatusCode } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [2/3] Test CORS HTTPS (autorisé)...
powershell -Command "try { $headers = @{'Origin' = 'https://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'CORS Header:' $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Host 'Erreur:' $_.Exception.Message }"
echo.

echo [3/3] Test CORS HTTP (refusé)...
powershell -Command "try { $headers = @{'Origin' = 'http://www.filmara.fr'}; $response = Invoke-WebRequest -Uri 'https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin' -Headers $headers -UseBasicParsing; Write-Host 'Status:' $response.StatusCode; Write-Host 'CORS Header:' $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Host 'Erreur CORS (attendu):' $_.Exception.Message }"
echo.

echo ========================================
echo TESTS TERMINÉS
echo ========================================
echo.
echo Vérifiez que :
echo ✅ API Health fonctionne
echo ✅ HTTPS autorisé (Status: 200)
echo ❌ HTTP refusé (Erreur CORS attendue)
echo.
echo Si c'est correct, déployez le frontend avec :
echo .\deploy-https-only.bat
echo.
pause
