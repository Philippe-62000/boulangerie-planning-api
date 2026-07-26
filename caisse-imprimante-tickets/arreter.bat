@echo off
cd /d "%~dp0"
if not exist "agent.pid" (
    echo L'agent ne semble pas en cours d'execution (pas de fichier agent.pid).
    pause
    exit /b 0
)
set /p AGENTPID=<agent.pid
taskkill /PID %AGENTPID% /F >nul 2>&1
del agent.pid >nul 2>&1
echo Agent arrete (PID %AGENTPID%).
echo Pour le desactiver definitivement, supprimez aussi :
echo %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\filmara-print-agent.vbs
pause
