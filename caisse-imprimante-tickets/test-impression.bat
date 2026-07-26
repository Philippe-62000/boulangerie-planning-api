@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0print-agent.ps1" -TestPrint
pause
