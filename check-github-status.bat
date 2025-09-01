@echo off
echo ========================================
echo Verification du statut GitHub
echo ========================================

echo.
echo 1. Status Git local...
git status

echo.
echo 2. Derniers commits...
git log --oneline -5

echo.
echo 3. Branches distantes...
git branch -a

echo.
echo 4. Remote origin...
git remote -v

echo.
echo ========================================
echo Verification terminee !
echo ========================================
pause
