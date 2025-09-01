@echo off
echo ========================================
echo Verification de l'historique Git
echo ========================================

echo.
echo 1. Derniers commits...
git log --oneline -10

echo.
echo 2. Changements dans render.yaml...
git log -p render.yaml

echo.
echo 3. Status actuel...
git status

echo.
echo ========================================
echo Verification terminee !
echo ========================================
pause
