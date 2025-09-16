@echo off
echo Uploading frontend files to OVH...

echo Copying files to OVH directory...
xcopy /E /Y /I frontend-build\* C:\inetpub\wwwroot\plan\

echo Upload completed!
echo.
echo Files uploaded to OVH:
echo - All frontend build files copied to C:\inetpub\wwwroot\plan\
echo - This includes the fixes for:
echo   * SalesStats.js (useCallback)
echo   * Planning.js (useCallback) 
echo   * AbsenceStatus.js (useCallback)
echo   * SickLeaveAdmin.js (useCallback)
echo   * Parameters.js (permissions icons)
echo.
echo The application should now work correctly!
echo.
pause






