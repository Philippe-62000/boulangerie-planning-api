@echo off
echo ========================================
echo Poussée des corrections des contraintes
echo ========================================

echo.
echo 1. Changement vers la branche master...
git checkout master

echo.
echo 2. Merge des corrections sur main...
git checkout main
git merge master

echo.
echo 3. Push sur main...
git push origin main

echo.
echo 4. Retour sur master...
git checkout master

echo.
echo ========================================
echo Corrections des contraintes poussees !
echo ========================================
pause
